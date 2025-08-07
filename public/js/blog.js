'use strict'
function syncHeights() {
    const blogList = document.getElementById("blogList");
    const blogPageBG = document.getElementById("BlogPageBG");

    if (blogList && blogPageBG) {
        const height = blogList.offsetHeight;
        blogPageBG.style.height = `${height}px`;
    }
}
document.addEventListener("DOMContentLoaded",syncHeights());
document.addEventListener("DOMContentLoaded",async function(){
    var blogListHTML="";
    syncHeights();
    

    async function fetchBlogItems() {
        try {
            const response = await fetch('/api/blog');
            return await response.json();
        } catch (error) {
            console.error('Error fetching bookings:', error);
            return [];
        }
    }
    window.addEventListener('resize', () => {
        syncHeights();
    });
    console.log(await fetchBlogItems());
    const blogItems= await fetchBlogItems();
    console.log(blogItems);
    const blogItemList=document.getElementById("blogItems");
    
    if(blogItems && blogItems.length>0){
        blogItems.forEach(item => {
            
            const encodedTitle = encodeURIComponent(item.id);
            if(item.Type != "pdf"){
                blogListHTML += `<a href='blogPost.html?title=${encodedTitle}'><li id="blogItem"><div class="blogPreviewHead"><h1>${item.Title}</h1><h2>${item.Author}</h2><h3>${item.Date}</h3></div>
                <p id="blogPreviewText">${item.Paragraph1.substring(0,250)}...<p></li></a>`;
            }
            else{
                blogListHTML += `<a href='blogPost.html?title=${encodedTitle}'><li id="blogItem"><div class="blogPreviewHead"><h1>${item.Title}</h1><h2>${item.Author}</h2><h3>${item.Date}</h3></div>
                </li></a>`;
            }
        });
        
    }
    updateList()
    function updateList(){
        blogItemList.innerHTML=blogListHTML;
        syncHeights();
    }
});