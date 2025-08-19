from flask import Flask, render_template, request, redirect, url_for, session, send_from_directory
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask import jsonify
from flask_cors import CORS
import sqlite3
import os
from werkzeug.middleware.proxy_fix import ProxyFix



app = Flask(__name__, static_folder="public")

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
@app.get("/login")
def login_page():
    return render_template("login.html")

# One JSON login endpoint your JS will call
@app.post("/api/login")
def api_login():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "")
    password = data.get("password", "")
    if username == VALID_USERNAME and password == VALID_PASSWORD:
        login_user(User(1), remember=True)   # sets session cookie; do NOT set cookies manually
        return jsonify({"ok": True})
    return jsonify({"ok": False, "error": "invalid_credentials"}), 401

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
@app.get("/admin")
@login_required
def admin():
    return render_template("admin.html")


@login_manager.user_loader
def load_user(user_id):
    return User(user_id)

# In production, store user/pass securely (e.g., hashed + env vars)
VALID_USERNAME = "admin"
VALID_PASSWORD = "ButtF8rtStinky"

def get_table_columns(table):
    conn = sqlite3.connect('Databases/Bookings-FP.db')
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

# @app.route('/login', methods=['GET', 'POST'])
# def login():
#     if request.method == 'POST':
#         # accept either form or JSON
#         data = request.get_json(silent=True) or {}
#         username = request.form.get('username') or data.get('username', '')
#         password = request.form.get('password') or data.get('password', '')

#         if username == VALID_USERNAME and password == VALID_PASSWORD:
#             login_user(User(1), remember=True)

#             # If this was a JSON/XHR login, return JSON (no redirect)
#             if request.is_json:
#                 return jsonify({"ok": True})

#             # If this was a normal HTML form post, redirect
#             return redirect(url_for('admin'))

#         # Bad creds: JSON gets JSON, form gets plain 401 text
#         if request.is_json:
#             return jsonify({"ok": False, "error": "invalid_credentials"}), 401
#         return "Invalid credentials", 401

#     return render_template('login.html')

# @app.route('/logout')
# @login_required
# def logout():
#     logout_user()
#     return redirect('/login')

# @app.route('/admin')
# @login_required
# def admin():
#     conn = sqlite3.connect('Databases/Bookings-FP.db')
#     c = conn.cursor()
#     c.execute("SELECT name FROM sqlite_master WHERE type='table'")
#     tables = c.fetchall()
#     conn.close()
#     return render_template('admin.html', tables=tables)

@app.route('/table/<table_name>')
@login_required
def view_table(table_name):
    conn = sqlite3.connect('Databases/Bookings-FP.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Get columns
    c.execute(f"PRAGMA table_info({table_name})")
    columns_info = c.fetchall()
    columns = [col[1] for col in columns_info]  # column[1] = column name

    # Get data
    c.execute(f"SELECT rowid, * FROM {table_name}")
    rows = c.fetchall()

    conn.close()
    return render_template('table.html', table_name=table_name, rows=rows, columns=columns)


@app.route('/update', methods=['POST'])
@login_required
def update_table():
    table = request.form['table']
    column = request.form['column']
    value = request.form['value']
    rowid = request.form['rowid']

    conn = sqlite3.connect('Databases/Bookings-FP.db')
    c = conn.cursor()
    query = f"UPDATE {table} SET {column} = ? WHERE rowid = ?"
    c.execute(query, (value, rowid))
    conn.commit()
    conn.close()
    return "Updated", 200

@app.route('/add_row', methods=['POST'])
@login_required
def add_row():
    table = request.form['table']

    # Filter out 'table' and any empty 'id' field
    columns = [key for key in request.form if key != 'table' and not (key == 'id' and request.form[key].strip() == '')]
    values = [request.form[key] for key in columns]

    quoted_columns = ', '.join([f'"{col}"' for col in columns])
    placeholders = ', '.join(['?'] * len(values))
    query = f'INSERT INTO "{table}" ({quoted_columns}) VALUES ({placeholders})'

    print(f"[DEBUG] Running query: {query}")
    print(f"[DEBUG] Values: {values}")

    # Execute the query
    conn = sqlite3.connect('Databases/Bookings-FP.db')
    c = conn.cursor()
    try:
        c.execute(query, values)
        conn.commit()
        return "Row added", 200
    except Exception as e:
        print("[ERROR]", e)
        return "Failed to add row", 400
    finally:
        conn.close()



@app.route('/delete_row', methods=['POST'])
@login_required
def delete_row():
    table = request.form['table']
    rowid = request.form['rowid']
    conn = sqlite3.connect('Databases/Bookings-FP.db')
    c = conn.cursor()
    try:
        c.execute(f"DELETE FROM {table} WHERE rowid = ?", (rowid,))
        conn.commit()
        return "Row deleted", 200
    except Exception as e:
        print("[ERROR]", e)
        return "Failed to delete", 400
    finally:
        conn.close()

@app.route('/api/bookings')
def api_bookings():
    print("[DEBUG] /api/bookings was hit!")
    conn = sqlite3.connect('Databases/Bookings-FP.db')
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

@app.route('/api/Communitybookings')
def api_Communitybookings():
    print("[DEBUG] /api/Communitybookings was hit!")
    conn = sqlite3.connect('Databases/Bookings-FP.db')
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
    conn = sqlite3.connect('Databases/Bookings-FP.db')
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