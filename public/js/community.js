'use strict'
async function fetchWithRetry(url, options = {}, retries = 3, backoff = 500) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { cache: "no-store", ...options });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i < retries) {
        // wait a bit longer each time
        const delay = backoff * Math.pow(2, i);
        console.warn(`Fetch failed (${err.message}), retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        console.error(`Fetch failed after ${retries + 1} attempts:`, err);
        return [];
      }
    }
  }
}
document.addEventListener('DOMContentLoaded', function(){
    var today = new Date();
    var tomorrow = new Date(2025,5,1);
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = parseInt(String(today.getMonth()).padStart(2, '0'));
    const thisMonth = mm;
    var yyyy = today.getFullYear();
    const CalendarObject=document.getElementById("#Community-Calendar");
    const DateObjects=document.getElementsByClassName("date-box");
    const mIntToMonth=["January","February","March","April","May","June","July","August","September","October","November","December"];
    const prevMonthButton= document.getElementById("prevMonthButton");
    const nextMonthButton=document.getElementById("nextMonthButton");
    const monthDisplay=document.getElementById("monthDisplay");
    const myModal = document.getElementById("eventModal")
    console.log(today);
    calendarMaker(mm,mIntToMonth[mm],yyyy);
    console.log(tomorrow);
    const ym = (y, m) => y * 12 + m;              // absolute month index
    const setFromYM = v => {                      // derive yyyy/mm from absolute month
        yyyy = Math.floor(v / 12);
        mm   = v % 12;
    };

    // Bounds: from "now" month to +5 months
    const BASE_Y = new Date().getFullYear();      // use the real current year
    const MIN_YM = ym(2025, 8);    // September = 8 (0-based)       // current month
    const MAX_YM = mm + 5;                    // current + 5 months

    // Track current view as absolute month (matches your existing yyyy/mm)
    let viewYM = ym(yyyy, mm);

    function renderAndUpdateButtons() {
    // sync yyyy/mm from viewYM
        setFromYM(viewYM);

        // render
        calendarMaker(mm, mIntToMonth[mm], yyyy);

        // buttons
        prevMonthButton.classList.toggle('hidden', viewYM <= MIN_YM);
        nextMonthButton.classList.toggle('hidden', viewYM >= MAX_YM);
    }

    // NEXT
    nextMonthButton.addEventListener("click", function () {
        if (viewYM < MAX_YM) {
            viewYM += 1;           // Date rollover implied by absolute month math
            renderAndUpdateButtons();
        }
    });

    // PREV
    prevMonthButton.addEventListener("click", function () {
    if (viewYM > MIN_YM) {
        viewYM -= 1;
        renderAndUpdateButtons();
    }
    });

    // Initial pass (ensures buttons reflect bounds immediately)
    renderAndUpdateButtons();
    async function fetchBookings() {
        // try {
        //     const response = await fetch('/api/bookings');
        //     return await response.json();
        // } catch (error) {
        //     console.error('Error fetching bookings:', error);
        //     return [];
        // }
        return await fetchWithRetry('/api/bookings');
    }
    
    async function calendarMaker(mm, monthText,year){
        monthDisplay.innerHTML=monthText;
        var dateOfImportance= new Date(year,mm,1);
        var dayOfWeek= dateOfImportance.getDay(); // Sunday Is 0
        // var todayCalendarSpot=dayOfWeek+8;
        // var calendarStart=1;
        // var dateInt=parseInt(dd)
        // var monthInt=parseInt(mm)
        // var lastMonthDays=new Date(yyyy,monthInt,0).getDate();
        var thisMonthDays=new Date (year,mm+1,0).getDate();
        // var lastMonthRollover=false;
        // var thisMonthMayRollover=true;
        // console.log(dateInt);
        // if(dateInt<8){
        //     lastMonthRollover=true;
        //     calendarStart=lastMonthDays-(8-dateInt+dayOfWeek);
        // }
        // else if(dateInt>14){
        //     thisMonthMayRollover=true;
        //     calendarStart=dateInt-(7+dayOfWeek);
        // }
        var calendarStart=1;
        var startDate=1;
        const calendarStarted=calendarStart;
        const CalendarObject=document.getElementById("Community-Calendar");
        CalendarObject.innerHTML=`<div class="date-box" id="community" data-day="1"></div>
                <div class="date-box" id="community" data-day="2"></div>
                <div class="date-box" id="community" data-day="3"></div>
                <div class="date-box" id="community" data-day="4"></div>
                <div class="date-box" id="community" data-day="5"></div>
                <div class="date-box" id="community" data-day="6"></div>
                <div class="date-box" id="community" data-day="7"></div>
                <div class="date-box" id="community" data-day="8"></div>
                <div class="date-box" id="community" data-day="9"></div>
                <div class="date-box" id="community" data-day="10"></div>
                <div class="date-box" id="community" data-day="11"></div>
                <div class="date-box" id="community" data-day="12"></div>
                <div class="date-box" id="community" data-day="13"></div>
                <div class="date-box" id="community" data-day="14"></div>
                <div class="date-box" id="community" data-day="15"></div>
                <div class="date-box" id="community" data-day="16"></div>
                <div class="date-box" id="community" data-day="17"></div>
                <div class="date-box" id="community" data-day="18"></div>
                <div class="date-box" id="community" data-day="19"></div>
                <div class="date-box" id="community" data-day="20"></div>
                <div class="date-box" id="community" data-day="21"></div>
                <div class="date-box" id="community" data-day="22"></div>
                <div class="date-box" id="community" data-day="23"></div>
                <div class="date-box" id="community" data-day="24"></div>
                <div class="date-box" id="community" data-day="25"></div>
                <div class="date-box" id="community" data-day="26"></div>
                <div class="date-box" id="community" data-day="27"></div>
                <div class="date-box" id="community" data-day="28"></div>
                <div class="date-box" id="community" data-day="29"></div>
                <div class="date-box" id="community" data-day="30"></div>
                <div class="date-box" id="community" data-day="31"></div>
                <div class="date-box" id="community" data-day="32"></div>
                <div class="date-box" id="community" data-day="33"></div>
                <div class="date-box" id="community" data-day="34"></div>
                <div class="date-box" id="community" data-day="35"></div>
             `
             if(thisMonthDays+dayOfWeek>35){
                CalendarObject.innerHTML+=`<div class="date-box" id="community" data-day="36"></div>
                <div class="date-box" id="community" data-day="37"></div>`
            }
        const DateObjects=document.getElementsByClassName("date-box");
        const bookings = await fetchBookings();
        for(const dateObject of DateObjects){
            console.log(calendarStart);
            console.log(startDate);
            if(dateObject._myAnon){
                dateObject.removeEventListener("click",dateObject._myAnon);
            }
            if (calendarStart < dayOfWeek + 1) {
                calendarStart++;
                dateObject.innerHTML = `<p></p>`;
                continue;
            }
            else if (startDate > thisMonthDays) {
                calendarStart++;
                dateObject.innerHTML = `<p></p>`;
                continue;
            }
            
            const dateStr = `${(mm + 1).toString().padStart(2, '0')}/${startDate.toString().padStart(2, '0')}/${year}`;
            console.log(dateStr);
            const eventsToday = bookings.filter(b => b.Date === dateStr);

            if (eventsToday.length) {
                console.log("True");
                dateObject.style.display = "flex";
                dateObject.style.flexDirection = "column";
                dateObject.innerHTML = "";
                var eventNum = 0;

                eventsToday.forEach(ev => {
                    // eventBox
                    var eventBox = document.createElement("div");
                    eventBox.classList.add("eventBox");
                    if (ev.Artist == "TBD") {
                        eventBox.style.backgroundImage = "url('Images/TBDImage.jpg')";
                    } else {
                        if(ev.Image_File_Path.substring(0,4)=="http"){
                            eventBox.style.backgroundImage = `url( ${ev.Image_File_Path})`;
                        }
                        else{
                            eventBox.style.backgroundImage = "url('Images/" + ev.Image_File_Path + "')";
                        }
                        
                    }

                    if (eventNum == 0) {
                        var pDate = document.createElement("p");
                        pDate.id = "evDate";
                        pDate.textContent = startDate;
                        eventBox.appendChild(pDate);
                    }

                    var h4 = document.createElement("h4");
                    if (ev.Artist == "TBD") {
                        h4.textContent = "TBD";
                    } else {
                        h4.textContent = ev.Artist;
                    }
                    eventBox.appendChild(h4);

                    // slideOver
                    var slideOver = document.createElement("div");
                    slideOver.classList.add("eventSlideOver", "hidden");

                    if (ev.Artist == "TBD") {
                        slideOver.innerHTML = 
                            "<p>" + ev.Date + "</p>" +
                            "<p>Times: " + ev.Time + "</p>" +
                            "<p>Interested?</p>";
                    } else {
                        slideOver.innerHTML = 
                            "<p>" + ev.Date + "</p>" +
                            "<p>" + ev.Time + "</p>" +
                            "<address>" + ev.Address + "</address>" +
                            "<p>" + ev.Ticket_Price + "</p>";
                    }

                    // hover
                    function showSlideOverFor(evBox, slOver) {
                        dateObject.querySelectorAll(".eventSlideOver").forEach(function(so) {
                            so.classList.add("hidden");
                        });
                        slOver.classList.remove("hidden");
                        dateObject.querySelectorAll(".eventBox").forEach(function(box) {
                            box.classList.remove("blur");
                        });
                        evBox.classList.add("blur");
                    }

                    // Hover on the eventBox
                    eventBox.addEventListener("mouseenter", function() {
                        showSlideOverFor(eventBox, slideOver);
                    });

                    // Also hover detection on the slideOver itself
                    slideOver.addEventListener("mousemove", function(e) {
                        // Get position relative to dateObject
                        const rect = dateObject.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const height = rect.height;
                        const boxHeight = height / eventsToday.length;

                        // Figure out which eventBox index we're over
                        const index = Math.floor(y / boxHeight);
                        const targetEventBox = dateObject.querySelectorAll(".eventBox")[index];
                        const targetSlideOver = dateObject.querySelectorAll(".eventSlideOver")[index];

                        if (targetEventBox && targetSlideOver) {
                            showSlideOverFor(targetEventBox, targetSlideOver);
                        }
                    });
                    dateObject.addEventListener("mouseleave", function() {
                        dateObject.querySelectorAll(".eventSlideOver").forEach(function(so) {
                            so.classList.add("hidden");
                        });
                        dateObject.querySelectorAll(".eventBox").forEach(function(box) {
                            box.classList.remove("blur");
                        });
                    });
                    function openEventModal(ev) {
                        var extraArtists = [];
                        if (ev.Artist2) {
                            extraArtists.push(ev.Artist2);
                        }
                        if (ev.Artist3) {
                            extraArtists.push(ev.Artist3);
                        }

                        var myHTMLBuilder = "<div class='modalContent'>" +
                            "<h3 id='bandName'>" + ev.Artist + "</h3>";

                        if (extraArtists.length > 0) {
                            myHTMLBuilder += "<div style='border: 2px solid #468caf; max-width:40%'>" +
                                "<h4>" + extraArtists[0] + "</h4>";
                            if (extraArtists.length > 1) {
                                myHTMLBuilder += "<h4>" + extraArtists[1] + "</h4>";
                            }
                            myHTMLBuilder += "</div>";
                        }

                        if (ev.Artist == "TBD") {
                            myHTMLBuilder +=
                                "<p id='eventDate'>" + ev.Date + "</p>" +
                                "<p id='eventTime'>Open Times: " + ev.Time + "</p>" +
                                "<p id='eventVenue'>" + ev.Venue + "</p>" +
                                "<address id='eventPlace'>" + ev.Address + "</address>" +
                                "<p> if you're an artist and would like to play <br>" +
                                "show interest with the email below. <br>" +
                                "Please provide the date and time you're interested in<br>" +
                                "as well as your name and phone number for easy communication</p>" +
                                "<a href='mailto:fork+plate@gmail.com?subject=" + ev.Date + "-(ARTIST NAME)-Artist-Interest-Form&body= I, (YOUR (Band's) NAME) am interested in playing on " + ev.Date + " at " + ev.Venue + " at (TIME) %0D%0A NAME %0D%0A ADDRESS'>Fork+Plate@gmail.com</a>";
                        } else {
                            myHTMLBuilder +=
                                "<p id='eventDate'>" + ev.Date + "</p>" +
                                "<p id='eventTime'>" + ev.Time + "</p>" +
                                "<p id='eventVenue'>" + ev.Venue + "</p>" +
                                "<address id='eventPlace'>" + ev.Address + "</address>" +
                                "<p id='eventPrice'>" + ev.Ticket_Price + "</p>";
                        }

                        if (ev.Any_Extra_Info) {
                            myHTMLBuilder += "<p>" + ev.Any_Extra_Info + "</p>";
                        }

                        myHTMLBuilder += "</div>";

                        myModal.innerHTML = myHTMLBuilder;
                        document.getElementById("eventModal").classList.remove("hidden");
                        slideOver.classList.add("hidden");
                        eventBox.classList.remove("blur");
                    }

                    // Listen for clicks on either eventBox or slideOver
                    
                    // click
                    eventBox.addEventListener("click", function() {
                        openEventModal(ev);
                    });
                    slideOver.addEventListener("click", function() {
                        openEventModal(ev);
                    });

                    dateObject.appendChild(slideOver);
                    dateObject.appendChild(eventBox);

                    eventNum += 1;
                });

                document.getElementById("eventModal").addEventListener("click", function() {
                    this.classList.add("hidden");
                });
            } else {
                dateObject.innerHTML = `<p id="evDate">${startDate}</p>`;
            }
            

            calendarStart++;
            startDate++;
            
        }
    }
    


    
});