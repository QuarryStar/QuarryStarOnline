from flask import Flask, render_template, request, redirect, url_for, session, send_from_directory
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask import jsonify
from flask_cors import CORS
import sqlite3
import os
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__, static_folder="public")

DB_PATH = os.environ.get("DB_PATH", "/data/Bookings-FP.db")

def open_conn():
    # robust defaults for SQLite in web apps
    conn = sqlite3.connect(DB_PATH, timeout=30, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Optional: make writes safer/faster for concurrent reads
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn
import traceback
from jinja2 import TemplateNotFound, UndefinedError
from flask_login import LoginManager, UserMixin, login_required, login_user, current_user

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login_page"  # if you have a /login page

# User model + loader (ensures session can be restored across requests)
class User(UserMixin):
    def __init__(self, user_id, username="admin"):
        self.id = str(user_id)
        self.name = username
        self.username = username  # some templates expect username

@login_manager.user_loader
def load_user(user_id: str):
    # TODO: replace with your real lookup if you have one
    return User(user_id)

# Return JSON for unauth API calls; keep redirect for page views
@login_manager.unauthorized_handler
def _unauth():
    from flask import request, jsonify, redirect, url_for
    if request.path.startswith("/api/"):
        return jsonify({"message": "unauthorized"}), 401
    return redirect(url_for("login_page", next=request.url))

# --- TEMP DIAGNOSTIC admin route wrapper ---
from flask import render_template

@app.get("/api/diag")
def api_diag():
    p = DB_PATH
    try:
        st = os.stat(p)
        size = st.st_size
        exists = True
    except FileNotFoundError:
        size = None
        exists = False
    return jsonify({"db_path": p, "db_exists": exists, "db_size": size})

@app.after_request
def _no_cache(resp):
    # don't touch streamed responses
    if getattr(resp, "direct_passthrough", False):
        return resp
    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    resp.headers["Pragma"] = "no-cache"
    return resp

@app.get("/admin")
@login_required
def admin():
    try:
        # If your template is named differently, change this:
        conn = open_conn()
        c = conn.cursor()
        c.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = c.fetchall()
        conn.close()
        return render_template('admin.html', tables=tables)
    except TemplateNotFound as e:
        # Most common production 500: wrong template path/name
        return (
            f"Template not found: {e.name}\n"
            f"Put your admin template at templates/admin.html (or set app.template_folder).",
            500, {"Content-Type": "text/plain; charset=utf-8"}
        )
    except UndefinedError as e:
        # Second most common: template references a var you didn't pass
        return (
            "Jinja variable missing/undefined in admin.html:\n"
            f"{e}\n\n"
            "Fix: pass the variable from the route (render_template('admin.html', var=...)) "
            "or guard in Jinja: {% if var %} ... {% endif %}.",
            500, {"Content-Type": "text/plain; charset=utf-8"}
        )
    except Exception:
        # Show full stack so you know the exact line failing (DB path, etc.)
        tb = traceback.format_exc()
        return (f"Unhandled error in /admin:\n\n{tb}",
                500, {"Content-Type": "text/plain; charset=utf-8"})

# use a stable secret in prod (env var); fallback if missing:
app.secret_key = os.environ.get("SECRET_KEY", "dev-insecure-change-me")

# cookies: public HTTPS, same-origin site
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=True,
)

# if you’re behind Fly.io / a reverse proxy, trust forwarded headers
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)

login_manager = LoginManager()
login_manager.login_view = "login_page"  # for HTML page redirects
login_manager.init_app(app)

# Return 401 JSON for API calls, but keep redirect for page views
@login_manager.unauthorized_handler
def _unauth():
    if request.path.startswith("/api/"):
        return jsonify({"message": "unauthorized"}), 401
    # keep the classic redirect with next=
    return redirect(url_for("login_page", next=request.url))


# --- your User model (example) ---
class User(UserMixin):
    def __init__(self, user_id):
        self.id = user_id
        self.name = "admin"

# Replace these with your real credentials / lookup
VALID_USERNAME = os.environ.get("ADMIN_USER", "admin")
VALID_PASSWORD = os.environ.get("ADMIN_PASS", "password")


# ------------------ AUTH ROUTES ------------------

# HTML login page (GET only)
@app.route('/login', methods=['GET', 'POST'])
def login_page():
    if request.method == 'GET':
        return render_template('login.html')

    # POST: form submit
    username = request.form.get('username', '')
    password = request.form.get('password', '')
    if username == VALID_USERNAME and password == VALID_PASSWORD:
        login_user(User(1), remember=True)
        next_url = request.args.get('next') or url_for('admin')
        return redirect(next_url)
    # (optional) re-render page with an error message
    return render_template('login.html', error='Invalid credentials'), 401


# Keep JSON login for fetch-based logins
@app.post('/api/login')
def api_login():
    data = request.get_json(silent=True) or {}
    if data.get('username') == VALID_USERNAME and data.get('password') == VALID_PASSWORD:
        login_user(User(1), remember=True)
        return jsonify({'ok': True})
    return jsonify({'ok': False, 'error': 'invalid_credentials'}), 401

@app.post("/api/logout")
@login_required
def api_logout():
    logout_user()
    return jsonify({"ok": True})

@app.get("/api/me")
def api_me():
    if current_user.is_authenticated:
        return jsonify({"ok": True, "user": getattr(current_user, "name", "user")})
    return jsonify({"ok": False}), 401


# Protect your admin page with Flask-Login cookie
# @app.get("/admin")
# @login_required
# def admin():
#     return render_template("admin.html")


@login_manager.user_loader
def load_user(user_id):
    return User(user_id)

# In production, store user/pass securely (e.g., hashed + env vars)
VALID_USERNAME = "admin"
VALID_PASSWORD = "ButtF8rtStinky"

def get_table_columns(table):
    conn = open_conn()
    c = conn.cursor()
    c.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in c.fetchall()]
    conn.close()
    return columns



# Routes
@app.route('/')
def public_index():
    # Serves public/index.html
    return send_from_directory(app.static_folder, "index.html")

@app.route("/<path:path>")
def public_files(path):
    return send_from_directory(app.static_folder, path)

@app.get("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login_page"))


@app.route('/table/<table_name>')
@login_required
def view_table(table_name):
    import os, sqlite3, traceback

    DB_PATH = os.path.join(os.path.dirname(__file__), 'Databases', 'Bookings-FP.db')
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()

        tq = quote_ident(table_name)

        # Get columns and PK info
        c.execute(f"PRAGMA table_info({tq})")
        cols = c.fetchall()
        if not cols:
            return f"Table '{table_name}' not found or has no columns.", 400

        columns = [r[1] for r in cols]             # column names
        pk_cols = [r[1] for r in cols if r[5] > 0] # r[5] > 0 => part of PK

        if len(pk_cols) != 1:
            # You said all tables you edit have a single PK—fail fast if not true
            return f"Table '{table_name}' does not have a single-column primary key.", 400

        pk = pk_cols[0]

        # Fetch some rows
        c.execute(f"SELECT * FROM {tq} LIMIT 200")
        rows = [dict(r) for r in c.fetchall()]   # convert to dicts for Jinja

        return render_template(
            'table.html',
            table_name=table_name,
            rows=rows,
            columns=columns,
            pk=pk,
            pk_cols=pk_cols
        )

    except sqlite3.OperationalError as e:
        print("[VIEW_TABLE OperationalError]", e)
        traceback.print_exc()
        return f"Could not open table '{table_name}': {e}", 400
    except Exception as e:
        print("[VIEW_TABLE ERROR]", e)
        traceback.print_exc()
        return "Internal server error.", 500
    finally:
        try:
            conn.close()
        except Exception:
            pass



@app.route('/add_row', methods=['POST'])
@login_required
def add_row():
    table = request.form['table']

    # Discover the PK name for this table
    conn = open_conn()
    c = conn.cursor()
    tq = quote_ident(table)
    c.execute(f"PRAGMA table_info({tq})")
    cols = c.fetchall()
    pk_cols = [r[1] for r in cols if r[5] > 0]
    pk = pk_cols[0] if pk_cols else None  # you enforce single-PK elsewhere

    # Build columns/values from form, skipping:
    # - the hidden 'table' field
    # - the PK if it is blank (let SQLite autoincrement)
    columns = []
    values = []
    for key, val in request.form.items():
        if key == 'table':
            continue
        if pk and key == pk and (val is None or val.strip() == ''):
            continue
        columns.append(key)
        values.append(val)

    quoted_columns = ', '.join([f'"{col}"' for col in columns])
    placeholders = ', '.join(['?'] * len(values))
    query = f'INSERT INTO "{table}" ({quoted_columns}) VALUES ({placeholders})'

    try:
        c.execute(query, values)
        conn.commit()
        # redirect back to the table page so you SEE the new row
        return redirect(url_for('view_table', table_name=table), code=303)
    except Exception as e:
        print("[ERROR add_row]", e)
        conn.rollback()
        return "Failed to add row", 400
    finally:
        conn.close()



def quote_ident(name: str) -> str:
    # minimal identifier quoting for SQLite: "double up" any embedded double quotes
    if not isinstance(name, str):
        raise ValueError("Identifier must be a string")
    return '"' + name.replace('"', '""') + '"'


@app.route('/update', methods=['POST'])
@login_required
def update_table():
    table  = request.form['table']
    column = request.form['column']
    value  = request.form['value']
    keycol = request.form['keycol']
    keyval = request.form['keyval']

    tq = quote_ident(table)
    cq = quote_ident(column)
    kq = quote_ident(keycol)

    conn = open_conn()
    c = conn.cursor()
    try:
        c.execute(f"UPDATE {tq} SET {cq} = ? WHERE {kq} = ?", (value, keyval))
        conn.commit()
        changed = c.rowcount  # how many rows updated
        print(f"[UPDATE] DB={DB_PATH} rows_changed={changed}")
        if changed == 0:
            return "No rows updated (check key).", 404
        return "OK", 200
    except Exception as e:
        print("[UPDATE ERROR]", e)
        return "Failed", 400
    finally:
        conn.close()

@app.route('/delete_row', methods=['POST'])
@login_required
def delete_row():
    table  = request.form['table']
    keycol = request.form['keycol']
    keyval = request.form['keyval']

    tq = quote_ident(table)
    kq = quote_ident(keycol)

    conn = open_conn()
    c = conn.cursor()
    try:
        c.execute(f"DELETE FROM {tq} WHERE {kq} = ?", (keyval,))
        conn.commit()
        changed = c.rowcount
        print(f"[DELETE] DB={DB_PATH} rows_changed={changed}")
        if changed == 0:
            return "No rows deleted (check key).", 404
        return "OK", 200
    except Exception as e:
        print("[DELETE ERROR]", e)
        return "Failed", 400
    finally:
        conn.close()

@app.route('/api/bookings')
def api_bookings():
    print("[DEBUG] /api/bookings was hit!")
    conn = open_conn()
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    try:
        c.execute('SELECT rowid, * FROM "Bookings"')
        rows = c.fetchall()
        data = [dict(row) for row in rows]
        print(f"[DEBUG] Returning {len(data)} bookings")
        return jsonify(data)
    except Exception as e:
        print(f"[ERROR] Fetching bookings failed: {e}")
        return jsonify({"error": "Failed to load bookings"}), 500
    finally:
        conn.close()

@app.route('/api/carousel')
def api_carousel():
    print("[DEBUG] /api/carousel was hit!")
    conn = open_conn()
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    try:
        c.execute('SELECT rowid, * FROM "Carousel"')
        rows = c.fetchall()
        data = [dict(row) for row in rows]
        print(f"[DEBUG] Returning {len(data)} Images")
        return jsonify(data)
    except Exception as e:
        print(f"[ERROR] Fetching Carousel failed: {e}")
        return jsonify({"error": "Failed to load Carousel"}), 500
    finally:
        conn.close()

@app.route('/api/Communitybookings')
def api_Communitybookings():
    print("[DEBUG] /api/Communitybookings was hit!")
    conn = open_conn()
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    try:
        c.execute('SELECT rowid, * FROM "CommunityBookings"')
        rows = c.fetchall()
        data = [dict(row) for row in rows]
        print(f"[DEBUG] Returning {len(data)} bookings")
        return jsonify(data)
    except Exception as e:
        print(f"[ERROR] Fetching bookings failed: {e}")
        return jsonify({"error": "Failed to load bookings"}), 500
    finally:
        conn.close()

@app.route('/api/blog')
def api_blog():
    conn = open_conn()
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    try:
        c.execute('SELECT * FROM BlogPosts ORDER BY id DESC')
        rows = c.fetchall()
        data = [dict(row) for row in rows]
        return jsonify(data)
    except Exception as e:
        print(f"[ERROR] /api/blog: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
if __name__ == '__main__':
    app.run(debug=True)