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


document.addEventListener('DOMContentLoaded', async function(){
    var today = new Date();
    var tomorrow = new Date(2025,5,1);
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = parseInt(String(today.getMonth()).padStart(2, '0'));
    let items = document.querySelectorAll('.carousel .carousel-item')
    const carouselContainer = document.querySelector('.carousel-container');
    const carouselTrack = document.querySelector('.carousel-track');

    const imageFilenames = [
        'forkLink',
        'blogLink'
    ];
    const carouselImages=await fetchCarousel();
    carouselImages.forEach(image =>{
        imageFilenames.push(image.FilePath);
    })
    function matchHemiHeight() {
        const about = document.querySelector('.aboutBackground');
        const hemi = document.querySelector('.hemi');
        if (about && hemi) {
            const aboutHeight = about.offsetHeight;
            hemi.style.height = `${aboutHeight + 20}px`; // 20px extra
        }
    }
    async function fetchBlogItems() {
        // try {
        //     const response = await fetch('/api/blog');
        //     return await response.json();
        // } catch (error) {
        //     console.error('Error fetching bookings:', error);
        //     return [];
        // }
        return await fetchWithRetry('/api/blog')
    }
    const forkBookings = await fetchForkBookings();
    today.setHours(0, 0, 0, 0); // ignore time portion

    const futureItems = forkBookings
      .map(item => ({
        ...item,
        dateObj: new Date(item.Date)
      }))
      .filter(item => item.dateObj >= today)
      .sort((a, b) => a.dateObj - b.dateObj);
    var cnt=0
    var soonest = futureItems[cnt] || null;

    while ((soonest==null || soonest.Artist=="TBD") && cnt<(futureItems.length -1)){
        cnt++;
        soonest=futureItems[cnt];
        
    }

    console.log(soonest);
    const blogItems= await fetchBlogItems();
    window.addEventListener('load', matchHemiHeight);
    window.addEventListener('resize', matchHemiHeight);
    let images = []; // We will populate this dynamically

    function populateCarousel() {
        carouselTrack.innerHTML = ''; // Clear any existing content
        images = [];

        imageFilenames.forEach(filename => {
            const div = document.createElement('div');
            div.classList.add("frame");
            if(filename=="blogLink"){
                if(blogItems.length>0){
                    const blogg = blogItems[0];
                    const encodedTitle = encodeURIComponent(blogg.id);
                    if(blogg.Type=="zine"){
                        div.innerHTML=`<a href='blogPost.html?title=${encodedTitle}' class="blogLink"><h1>${blogg.Title}</h1><h2>${blogg.Author}</h2><p>Check Out The Latest Edition Of The Telecast Zine Here!</p></a>`
                    }
                    else{
                        div.innerHTML=`<a href='blogPost.html?title=${encodedTitle}' class="blogLink"><h1>${blogg.Title}</h1><h2>${blogg.Author}</h2><p>${blogg.Paragraph1.substring(0,150)}...</p></a>`
                    }
                    
                }
                
            }
            else if(filename=="forkLink"){
                if(soonest==null){
                    div.innerHTML=`<a href='fork+plate.html' class="forkLink" style="background-image:url(Images/TBDImage.jpg)"><h1>Upcoming</h1><h2>TBD</h2><p>Fork+Plate</p></a>`
                }
                else if(soonest.Artist=="TBD"){
                    div.innerHTML=`<a href='fork+plate.html' class="forkLink" style="background-image:url(Images/TBDImage.jpg)"><h1>${soonest.Artist}</h1><h2>${soonest.Date}</h2><p>Fork+Plate</p></a>`

                }
                else{
                    if(soonest.Image_File_Path){
                        if(soonest.Image_File_Path.substring(0,4)=="http"){
                        div.innerHTML=`<a href='fork+plate.html' class="forkLink" style="background-image:url(${soonest.Image_File_Path})"><h1>${soonest.Artist}</h1><h2>${soonest.Date}</h2><p>${soonest.Venue}</p></a>`

                    }
                        else{
                            div.innerHTML=`<a href='fork+plate.html' class="forkLink" style="background-image:url(Images/${soonest.Image_File_Path})"><h1>${soonest.Artist}</h1><h2>${soonest.Date}</h2><p>${soonest.Venue}</p></a>`
                        }
                    }
                    else{
                            div.innerHTML=`<a href='fork+plate.html' class="forkLink"><h1>${soonest.Artist}</h1><h2>${soonest.Date}</h2><p>${soonest.Venue}</p></a>`
                    }
                    
                }

            }
            else{
                if(filename.substring(0,4)=="http"){
                    div.innerHTML=`<img class='carouselImage' src='${filename}' alt='${filename}'>`;
                }
                else{
                    div.innerHTML=`<img class='carouselImage' src='Images/Carousel/${filename}' alt='${filename}'>`;
                }
            }
            carouselTrack.appendChild(div);
            images.push(div);
        });
    }
    const prevButton = document.querySelector('.carousel-button.prev');
    const nextButton = document.querySelector('.carousel-button.next');
    let currentIndex = 0;
    let itemsToShow;
    let intervalId;
    const scrollIntervalTime = 5000; // Time between scrolls in milliseconds

    function updateItemsToShow() {
    if (window.innerWidth > 900) {
        itemsToShow = 3;
    } else if (window.innerWidth > 600) {
        itemsToShow = 2;
    } else {
        itemsToShow = 1;
    }
}

    function scrollToItem(index) {
        const itemWidth = images[0].getBoundingClientRect().width;
        const trackLeft = carouselTrack.getBoundingClientRect().left;
        const itemLeft = images[index].getBoundingClientRect().left;
        const offset = itemLeft - trackLeft;
        
        carouselTrack.style.transform = `translateX(-${offset}px)`;

    }
    function cloneImages() {
        for (let i = 0; i < itemsToShow; i++) {
            const clone = images[i].cloneNode(true);
            carouselTrack.appendChild(clone);
            images.push(clone);
        }
    }
    function nextSlide() {
        const totalOriginalItems = images.length - itemsToShow + 1; // Exclude clones

        currentIndex++;
        if (currentIndex >= totalOriginalItems) {
            // Immediately jump to the beginning (the cloned set) without animation
            carouselTrack.style.transition = 'none';
            currentIndex = 0;
            scrollToItem(currentIndex);
            // Force a reflow to apply the jump immediately
            carouselTrack.offsetHeight;
            carouselTrack.style.transition = 'transform 0.3s ease-in-out'; // Restore transition
            // Then, advance to the next slide to show the cloned first item scrolling in
            setTimeout(() => {
                currentIndex++;
                scrollToItem(currentIndex);
            }, 50); // Small delay to ensure the jump is visually separate
        } else {
            scrollToItem(currentIndex);
        }
    }
    function goToPrev() {
        currentIndex = Math.max(currentIndex - 1, 0);
        scrollToItem(currentIndex);
    }

    function startAutoscroll() {
        intervalId = setInterval(nextSlide, scrollIntervalTime);
    }

    function stopAutoscroll() {
        clearInterval(intervalId);
    }
    // Initial setup
    populateCarousel();
    updateItemsToShow();
    cloneImages();
    scrollToItem(currentIndex);
    startAutoscroll();
    carouselContainer.addEventListener('mouseenter', stopAutoscroll);
    carouselContainer.addEventListener('mouseleave', startAutoscroll);
    prevButton.addEventListener('click', goToPrev);
    nextButton.addEventListener('click', nextSlide);
    window.addEventListener('resize', () => {
        updateItemsToShow();
        populateCarousel();
        cloneImages();
        scrollToItem(currentIndex);
        stopAutoscroll();
        startAutoscroll();
    });

    const thisMonth = mm;
    var yyyy = today.getFullYear();
    const CalendarObject=document.getElementById("#F+P-Calendar");
    const DateObjects=document.getElementsByClassName("date-box");
    const mIntToMonth=["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
    const prevMonthButton= document.getElementById("prevMonthButton");
    const nextMonthButton=document.getElementById("nextMonthButton");
    const monthDisplay=document.getElementById("monthDisplay");
    const myModal = document.getElementById("eventModal");
    console.log(today);
    calendarMaker(mm,mIntToMonth[mm],yyyy);
    console.log(tomorrow);
    prevMonthButton.addEventListener("click",function(){
        if(mm>thisMonth){
            if(mm==thisMonth+5||(mm==thisMonth+5-12)){
                nextMonthButton.classList.remove("hidden")
            }
            mm-=1;
            if(mm==thisMonth){
                prevMonthButton.classList.add("hidden");
            }
            calendarMaker(mm,mIntToMonth[mm],yyyy)
        }
        if(mm==0&& thisMonth>=7){
            mm=11;
            yyyy-=1;
            if(mm<thisMonth+5){
                nextMonthButton.classList.remove("hidden");
            }
            if(mm==thisMonth){
                prevMonthButton.classList.add("hidden");
            }
            calendarMaker(mm,mIntToMonth[mm],yyyy)
        }
    })

    nextMonthButton.addEventListener("click",function(){
        if(mm<thisMonth+5){
            if(mm==thisMonth){
                prevMonthButton.classList.remove("hidden");
            }
            
            mm+=1;
            if(mm==thisMonth+5){
                nextMonthButton.classList.add("hidden")
            }
            if(mm==12){
                mm=0;
                yyyy+=1;
            }
            calendarMaker(mm,mIntToMonth[mm],yyyy)
        }
        if(mm==11&& thisMonth>7){
            mm=0;
            yyyy+=1;
            if(mm==thisMonth+5){
                nextMonthButton.classList.add("hidden")
            }
            calendarMaker(mm,mIntToMonth[mm],yyyy)
        }

    })
    async function fetchBookings() {
        // try {
        //     const response = await fetch('/api/Communitybookings');
        //     return await response.json();
        // } catch (error) {
        //     console.error('Error fetching bookings:', error);
        //     return [];
        // }
        return await fetchWithRetry('/api/Communitybookings');
    }
    async function fetchCarousel(){
        // try {
        //     const response = await fetch('/api/carousel');
        //     return await response.json();
        // } catch (error) {
        //     console.error('Error fetching bookings:', error);
        //     return [];
        // }
        return await fetchWithRetry('/api/carousel');
    }
    async function fetchForkBookings() {
        // try {
        //     const response = await fetch('/api/bookings');
        //     return await response.json();
        // } catch (error) {
        //     console.error('Error fetching bookings:', error);
        //     return [];
        // }
        return await fetchWithRetry('/api/bookings');
    }

async function calendarMaker(mm, monthText, year) {
  monthDisplay.innerHTML = monthText;
  const dayOfWeek = new Date(year, mm, 1).getDay();
  const thisMonthDays = new Date(year, mm + 1, 0).getDate();
  const calendarAdder= document.getElementById("F+P-Calendar")
  calendarAdder.innerHTML=`<div class="date-box" data-day="1"></div>
                <div class="date-box" data-day="2"></div>
                <div class="date-box" data-day="3"></div>
                <div class="date-box" data-day="4"></div>
                <div class="date-box" data-day="5"></div>
                <div class="date-box" data-day="6"></div>
                <div class="date-box" data-day="7"></div>
                <div class="date-box" data-day="8"></div>
                <div class="date-box" data-day="9"></div>
                <div class="date-box" data-day="10"></div>
                <div class="date-box" data-day="11"></div>
                <div class="date-box" data-day="12"></div>
                <div class="date-box" data-day="13"></div>
                <div class="date-box" data-day="14"></div>
                <div class="date-box" data-day="15"></div>
                <div class="date-box" data-day="16"></div>
                <div class="date-box" data-day="17"></div>
                <div class="date-box" data-day="18"></div>
                <div class="date-box" data-day="19"></div>
                <div class="date-box" data-day="20"></div>
                <div class="date-box" data-day="21"></div>
                <div class="date-box" data-day="22"></div>
                <div class="date-box" data-day="23"></div>
                <div class="date-box" data-day="24"></div>
                <div class="date-box" data-day="25"></div>
                <div class="date-box" data-day="26"></div>
                <div class="date-box" data-day="27"></div>
                <div class="date-box" data-day="28"></div>
                <div class="date-box" data-day="29"></div>
                <div class="date-box" data-day="30"></div>
                <div class="date-box" data-day="31"></div>
                <div class="date-box" data-day="32"></div>
                <div class="date-box" data-day="33"></div>
                <div class="date-box" data-day="34"></div>
                <div class="date-box" data-day="35"></div>
  `
  let startDate = 1;
  let calendarStart = 1;
  if(thisMonthDays+dayOfWeek>35){
    calendarAdder.innerHTML+=`<div class="date-box" data-day="36"></div>
                <div class="date-box" data-day="37"></div>`
  }
  const DateObjects = document.getElementsByClassName("date-box");
  const bookings = await fetchBookings();
    
  for (const dateObject of DateObjects) {
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
        // let the cell grow with stacked event boxes
        dateObject.style.display = "flex";
        dateObject.style.flexDirection = "column";
        dateObject.innerHTML = "";

        let eventNum = 0;
        eventsToday.forEach(event => {
            // event box
            const eventBox = document.createElement("div");
            eventBox.classList.add("eventBox");

            // background
            if (event.Artist1 === "TBD") {
            eventBox.style.backgroundImage = "url('Images/TBDImage.jpg')";
            } else if (event.Image_FilePath && event.Image_FilePath.substring(0,4) === "http") {
            eventBox.style.backgroundImage = `url(${event.Image_FilePath})`;
            } else if (event.Image_FilePath) {
            eventBox.style.backgroundImage = `url('Images/${event.Image_FilePath}')`;
            }

            // put the calendar day number on the first event only
            if (eventNum === 0) {
            const pDate = document.createElement("p");
            pDate.className = "evDate";           // use a class, avoid duplicate IDs
            pDate.textContent = startDate;
            eventBox.appendChild(pDate);
            }

            const h4 = document.createElement("h4");
            h4.textContent = event.Artist1 === "TBD" ? "TBD" : event.Artist1;
            eventBox.appendChild(h4);

            // slide-over
            const slideOver = document.createElement("div");
            slideOver.classList.add("eventSlideOver", "hidden");
            slideOver.innerHTML =
            event.Artist1 === "TBD"
                ? `<p>${event.Date}</p><p>Times: ${event.Time}</p><p>${event.Venue}</p><p>Interested?</p>`
                : `<p>${event.Date}</p><p>${event.Time}</p><p>${event.Venue}</p><address>${event.Address}</address><p>${event.TicketPrice}</p>`;

            // hover behavior (kept simple)
            eventBox.addEventListener("mouseenter", () => {
            dateObject.querySelectorAll(".eventSlideOver").forEach(so => so.classList.add("hidden"));
            dateObject.querySelectorAll(".eventBox").forEach(b => b.classList.remove("blur"));
            slideOver.classList.remove("hidden");
            eventBox.classList.add("blur");
            });
            dateObject.addEventListener("mouseleave", () => {
            dateObject.querySelectorAll(".eventSlideOver").forEach(so => so.classList.add("hidden"));
            dateObject.querySelectorAll(".eventBox").forEach(b => b.classList.remove("blur"));
            });

            // click → modal (reuse your existing handler contents)
            eventBox.addEventListener("click", () => { /* open modal with this event */ });

            // append
            dateObject.appendChild(slideOver);
            dateObject.appendChild(eventBox);
            eventNum += 1;
        });
    } else {
        dateObject.innerHTML = `<p class="evDate">${startDate}</p>`;
    }
    

    calendarStart++;
    startDate++;
  }
}
    


    
});