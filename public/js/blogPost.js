'use strict'

const params = new URLSearchParams(window.location.search);
const title = params.get("title");
function buildPdfSrc(rawPath) {
  if (!rawPath) return null;
  const isAbs = /^https?:\/\//i.test(rawPath);

  // If someone pasted a github "blob" URL, rewrite it to raw
  if (isAbs && rawPath.startsWith("https://github.com/") && rawPath.includes("/blob/")) {
    const parts = rawPath.split("/");
    const user = parts[3], repo = parts[4], branch = parts[6], path = parts.slice(7).join("/");
    rawPath = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${path}`;
  }

  // If the file is hosted by GitHub attachment/raw hosts → proxy it (no CORS/X-Frame issues)
  const isGH = isAbs && (
    rawPath.startsWith("https://github.com/user-attachments/") ||
    rawPath.startsWith("https://objects.githubusercontent.com/") ||
    rawPath.startsWith("https://media.githubusercontent.com/") ||
    rawPath.startsWith("https://raw.githubusercontent.com/") ||
    rawPath.startsWith("https://user-images.githubusercontent.com/")
  );
  if (isGH) return `/asset-proxy?url=${encodeURIComponent(rawPath)}`;

  // If you store bare filenames in DB, serve from your volume via /files/<name>
  if (!isAbs) return `/files/${rawPath.replace(/^\/+/, "")}`;

  // Otherwise use it as-is
  return rawPath;
}
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

        let htmlBuilder = "";

        if (post.Type === "zine") {
            // Accept either an absolute GitHub link or a bare filename from DB
            const rawPath = post.Image2Filepath;
            const pdfSrc = buildPdfSrc(rawPath);

            function supportsPDFs() {
            const el = document.createElement("embed");
            el.type = "application/pdf";
            return !!el.type && navigator.mimeTypes["application/pdf"] !== undefined;
            }

            if (supportsPDFs() && pdfSrc) {
            htmlBuilder += `
                <div class="pdf-container" style="width:100%; max-width:900px; margin:auto;">
                <iframe
                    src="${pdfSrc}#view=FitH"
                    style="width:100%; height:80vh; border:none;"
                    loading="lazy"
                    title="PDF">
                </iframe>
                </div>
                <p style="text-align:center; margin-top:10px;">
                <a href="${pdfSrc}" target="_blank" rel="noopener">📄 View or Download PDF</a>
                </p>
            `;
            } else if (pdfSrc) {
            htmlBuilder += `
                <p style="text-align:center; margin-top:10px;">
                Your browser can't display PDFs inline.
                <a href="${pdfSrc}" target="_blank" rel="noopener">📄 View or Download PDF</a>
                </p>
            `;
            }

            document.getElementById("blogPostBody").innerHTML = htmlBuilder;
            return; // prevent falling through to image/paragraph rendering
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
                if(post.Image1Filepath.substring(0,4)=="http"){
                    htmlBuilder+=`<img class="BPImage" src="${post.Image1Filepath}" alt="Blog Image">`

                }
                else{
                    htmlBuilder+=`<img class="BPImage" src="Images/BlogImages/${post.Image1Filepath}" alt="Blog Image">`
                }
            }
            if(post.Image2Filepath){
                if(post.Image2Filepath.substring(0,4)=="http"){
                    htmlBuilder+=`<img class="BPImage" src="${post.Image2Filepath}" alt="Blog Image">`
                }
                else{
                    htmlBuilder+=`<img class="BPImage" src="Images/BlogImages/${post.Image2Filepath}" alt="Blog Image">`
                }
            }
            if(post.Image3Filepath){
                if(post.Image3Filepath.substring(0,4)=="http"){
                    htmlBuilder+=`<img class="BPImage" src="${post.Image3Filepath}" alt="Blog Image">`

                }
                else{
                    htmlBuilder+=`<img class="BPImage" src="Images/BlogImages/${post.Image3Filepath}" alt="Blog Image">`
                }            }
            if(htmlBuilder!=""){
                document.getElementById("blogPostBody").innerHTML=htmlBuilder;
            }
        }
    }

})