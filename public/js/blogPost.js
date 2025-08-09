'use strict'

const params = new URLSearchParams(window.location.search);
const title = params.get("title");
document.addEventListener("DOMContentLoaded", async function(){
    const prevButton = document.getElementById("BlogPostBackButton");
    const nextButton = document.getElementById("BlogPostNextButton");
    async function fetchBlogItems() {
        try {
            const response = await fetch('/api/blog');
            return await response.json();
        } catch (error) {
            console.error('Error fetching bookings:', error);
            return [];
        }
    }
    const blogItems= await fetchBlogItems();
    console.log(blogItems);
    console.log(title);
    var lastShow = false;
    var nextShow = true;
    var post="";
    blogItems.forEach(item =>{
        console.log(item.id);
        if(item.id<title){
            prevButton.classList.remove("hidden");
            lastShow=true;
        }
        if(item.id==title){
            post = item;
            
        }
        if(item.id>title){
            nextButton.classList.remove("hidden");
            nextShow=true;
        }
        
    })
    if(!post){
        prevButton.classList.add("hidden");
        nextButton.classList.add("hidden");

    }
    if(!lastShow & !prevButton.classList.contains("hidden")){
        prevButton.classList.add("hidden");
    }
    if(!nextShow & !nextButton.classList.contains("hidden")){
        nextButton.classList.add("hidden");
    }
    
    prevButton.addEventListener("click", ()=>{
        if(post){
            const encodedTitle = encodeURIComponent(post.id-1);
            window.location.href = `blogPost.html?title=${encodedTitle}`;
        }
        
    })
    nextButton.addEventListener("click", ()=>{
        if(post){
            const encodedTitle = encodeURIComponent(post.id+1);
            window.location.href = `blogPost.html?title=${encodedTitle}`;
        }
    })
    if (post) {
        document.getElementById("blogPostTitle").innerHTML = post.Title;
        
        document.getElementById("blogPostDate").textContent = post.Date;
        document.getElementById("BlogPostAuthor").textContent = post.Author;
        var htmlBuilder="";
        if (post.Type === "zine") {
            const pdfPath = `Images/BlogImages/${post.Image1Filepath}`;

            // Function to check PDF inline support
            function supportsPDFs() {
                const testEl = document.createElement('embed');
                testEl.type = 'application/pdf';
                return !!testEl.type && navigator.mimeTypes['application/pdf'] !== undefined;
            }

            if (supportsPDFs()) {
                // Show inline PDF
                htmlBuilder += `
                    <div class="pdf-container" style="width:100%; max-width:900px; margin:auto;">
                        <iframe 
                            src="${pdfPath}#view=FitH" 
                            style="width:100%; height:80vh; border:none;" 
                            loading="lazy">
                        </iframe>
                    </div>
                    <p style="text-align:center; margin-top:10px;">
                        <a href="${pdfPath}" target="_blank" rel="noopener">
                            📄 View or Download PDF
                        </a>
                    </p>
                `;
            } else {
            // No PDF support → show only the link
            htmlBuilder += `
                <p style="text-align:center; margin-top:10px;">
                    Your browser can't display PDFs inline. 
                    <a href="${pdfPath}" target="_blank" rel="noopener">
                        📄 View or Download PDF
                    </a>
                </p>
            `;
        }

        document.getElementById("blogPostBody").innerHTML = htmlBuilder;
    }  else {
        
            if(post.Paragraph1){
                htmlBuilder+="<p>"+post.Paragraph1;
                if(post.Paragraph2){
                    htmlBuilder+="</p><p>"+post.Paragraph2;
                }
                if(post.Paragraph3){
                    htmlBuilder+="</p><p>"+post.Paragraph3;
                }
                if(post.Paragraph4){
                    htmlBuilder+="</p><p>"+post.Paragraph4;
                }
                htmlBuilder+="</p>"
            }
            if(post.Image1Filepath){
                htmlBuilder+=`<img class="BPImage" src="Images/BlogImages/${post.Image1Filepath}" alt="Blog Image">`
            }
            if(post.Image2Filepath){
                htmlBuilder+=`<img class="BPImage" src="Images/BlogImages/${post.Image2Filepath}" alt="Blog Image">`
            }
            if(post.Image3Filepath){
                htmlBuilder+=`<img class="BPImage" src="Images/BlogImages/${post.Image3Filepath}" alt="Blog Image">`
            }
            if(htmlBuilder!=""){
                document.getElementById("blogPostBody").innerHTML=htmlBuilder;
            }
        }
    }

})