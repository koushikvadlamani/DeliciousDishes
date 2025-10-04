const recipeList = document.getElementById("recipe-list");
const modal = document.getElementById("recipe-modal");
const modalTitle = document.getElementById("modal-title");
const modalImg = document.getElementById("modal-img");
const modalIngredients = document.getElementById("modal-ingredients");
const modalCalories = document.getElementById("modal-calories");
const modalInstructions = document.getElementById("modal-instructions");
const modalVideo = document.getElementById("modal-video");
const modalClose = document.getElementById("modal-close");
const modalCuisine = document.getElementById("modal-cuisine");
const modalCategory = document.getElementById("modal-category");
const modalStars = document.getElementById("modal-stars");
const copyPopup = document.getElementById("copy-popup");

const nameSearch = document.getElementById("name-search");
const searchNameBtn = document.getElementById("search-name-btn");
const ingredientSearch = document.getElementById("ingredient-search");
const addIngredientBtn = document.getElementById("add-ingredient-btn");
const searchIngredientsBtn = document.getElementById("search-ingredients-btn");
const ingredientChips = document.getElementById("ingredient-chips");

const homeBtn = document.getElementById("home-btn");
const favBtn = document.getElementById("fav-btn");
const loadMoreBtn = document.getElementById("load-more");

const filterBtn = document.getElementById("filter-btn");
const filterModal = document.getElementById("filter-modal");
const applyFilterBtn = document.getElementById("apply-filter");
const cancelFilterBtn = document.getElementById("cancel-filter");
const cuisineFilter = document.getElementById("cuisine-filter");
const categoryFilter = document.getElementById("category-filter");
const timeFilter = document.getElementById("time-filter");

let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
let selectedIngredients = [];
let currentRecipes = [];
let displayedCount = 0;
const batchSize = 6;
let filterActive = false;
let favActive = false;
let ingredientSearchActive = false;
let displayedRecipes = new Set();

addIngredientBtn.addEventListener("click", () => {
  const val = ingredientSearch.value.trim();
  if (val && !selectedIngredients.includes(val)) {
    selectedIngredients.push(val);
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = val + " ×";
    chip.onclick = () => {
      chip.remove();
      selectedIngredients = selectedIngredients.filter(i => i !== val);
    };
    ingredientChips.appendChild(chip);
    ingredientSearch.value = "";
  }
});

modalClose.addEventListener("click", () => {
  modal.style.display = "none";
  modalVideo.innerHTML = "";
});
window.addEventListener("click", e => {
  if (e.target === modal) {
    modal.style.display = "none";
    modalVideo.innerHTML = "";
  }
});

searchNameBtn.addEventListener("click", () => { filterActive=false; ingredientSearchActive=false; fetchByName(nameSearch.value.trim()); });
searchIngredientsBtn.addEventListener("click", () => { filterActive=false; ingredientSearchActive=true; filterRecipes(); });
favBtn.addEventListener("click", () => { displayedCount=0; favActive=true; displayedRecipes.clear(); displayRecipes(currentRecipes.filter(r=>favorites.includes(r.idMeal)), true); });
homeBtn.addEventListener("click", () => { displayedCount=0; favActive=false; ingredientSearchActive=false; displayedRecipes.clear(); loadTrending(); });
loadMoreBtn.addEventListener("click", ()=>displayRecipes(currentRecipes,false));

window.addEventListener("scroll", () => {
  if(!filterActive && !favActive && !ingredientSearchActive){
    if((window.innerHeight + window.scrollY) >= document.body.offsetHeight-100){
      displayRecipes(currentRecipes,false);
    }
  }
});

filterBtn.addEventListener("click",()=>{ filterModal.style.display="flex"; });
cancelFilterBtn.addEventListener("click",()=>{ filterModal.style.display="none"; filterActive=false; });
window.addEventListener("click", e=>{ if(e.target===filterModal){ filterModal.style.display="none"; filterActive=false; }});
applyFilterBtn.addEventListener("click",()=>{
  filterActive=true; filterModal.style.display="none";
  const cuisine = cuisineFilter.value; const category = categoryFilter.value; const time = timeFilter.value;
  const filtered = currentRecipes.filter(r=>{
    let pass=true;
    if(cuisine && !r.strArea.toLowerCase().includes(cuisine.toLowerCase())) pass=false;
    if(category && !r.strCategory.toLowerCase().includes(category.toLowerCase())) pass=false;
    if(time){
      const tMap={"Dessert":25,"Chicken":45,"Seafood":40,"Vegetarian":20,"Lamb":60};
      const t = tMap[r.strCategory] || 30;
      if(time==="Short" && t>30) pass=false;
      if(time==="Medium" && (t<30||t>60)) pass=false;
      if(time==="Long" && t<=60) pass=false;
    }
    return pass;
  });
  displayedCount=0; displayedRecipes.clear(); displayRecipes(filtered,true);
});

async function loadTrending() {
  recipeList.innerHTML = "<p>Loading trending recipes...</p>";
  const categories=["Seafood","Vegetarian","Chicken","Dessert"];
  currentRecipes=[];
  for(let cat of categories){
    const res=await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${cat}`);
    const data=await res.json();
    for(let m of data.meals.slice(0,10)){
      if(m.strMeal.toLowerCase().includes("beef")||m.strMeal.toLowerCase().includes("pork")) continue;
      const res2=await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${m.idMeal}`);
      const full=await res2.json();
      currentRecipes.push(full.meals[0]);
    }
  }
  displayedCount=0; displayedRecipes.clear();
  displayRecipes(currentRecipes,true);
}

async function fetchByName(name){
  if(!name) return;
  const res=await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${name}`);
  const data=await res.json();
  currentRecipes=(data.meals||[]).filter(r=>!r.strMeal.toLowerCase().includes("beef") && !r.strMeal.toLowerCase().includes("pork"));
  displayedCount=0; displayedRecipes.clear();
  displayRecipes(currentRecipes,true);
}

function filterRecipes(){
  const filtered=currentRecipes.filter(r=>{
    return selectedIngredients.every(ing=>{
      for(let i=1;i<=20;i++){
        if(r[`strIngredient${i}`] && r[`strIngredient${i}`].toLowerCase().includes(ing.toLowerCase())) return true;
      }
      return false;
    });
  });
  displayedCount=0; displayedRecipes.clear();
  displayRecipes(filtered,true);
}

function displayRecipes(list, reset=false){
  if(reset){ recipeList.innerHTML=""; displayedRecipes.clear(); }
  if(!list.length){ recipeList.innerHTML="<p>No recipes found!</p>"; return; }
  const nextBatch = list.slice(displayedCount, displayedCount+batchSize);
  nextBatch.forEach(r=>{
    if(displayedRecipes.has(r.idMeal)) return;
    displayedRecipes.add(r.idMeal);
    const card=document.createElement("div");
    card.className="recipe-card";
    card.innerHTML=`
      <img src="${r.strMealThumb}">
      <h3>${r.strMeal}</h3>
      <div class="meta">Cuisine: ${r.strArea} | Category: ${r.strCategory}</div>
      <div class="calories">Calories: ${Math.floor(Math.random()*400+100)} kcal</div>
      <button class="view-btn">View Recipe</button>
      <span class="heart">&#10084;</span>
    `;
    const heart=card.querySelector(".heart");
    if(favorites.includes(r.idMeal)) heart.classList.add("fav");
    heart.addEventListener("click", e=>{
      e.stopPropagation();
      if(favorites.includes(r.idMeal)){
        favorites=favorites.filter(i=>i!==r.idMeal); heart.classList.remove("fav");
      } else { favorites.push(r.idMeal); heart.classList.add("fav"); }
      localStorage.setItem("favorites",JSON.stringify(favorites));
    });
    const viewBtn=card.querySelector(".view-btn");
    viewBtn.addEventListener("click", e=>{
      e.stopPropagation();
      openModal(r);
    });
    recipeList.appendChild(card);
  });
  displayedCount+=nextBatch.length;
}

function openModal(r){
  modalTitle.textContent=r.strMeal;
  modalImg.src=r.strMealThumb;
  modalCuisine.textContent=r.strArea;
  modalCategory.textContent=r.strCategory;
  modalCalories.textContent=Math.floor(Math.random()*400+100)+" kcal";

  modalIngredients.innerHTML="<tr><th>Ingredient</th><th>Measure</th></tr>";
  for(let i=1;i<=20;i++){
    if(r[`strIngredient${i}`]){
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${r[`strIngredient${i}`]}</td><td>${r[`strMeasure${i}`]}</td>`;
      modalIngredients.appendChild(tr);
    }
  }

  const instr=r.strInstructions.split('. ').filter(s=>s.trim()!=="");
  let instrHTML="<table>";
  instr.forEach((step,i)=>{ instrHTML+=`<tr><td>Step ${i+1}</td><td>${step}.</td></tr>`; });
  instrHTML+="</table>";
  modalInstructions.innerHTML=instrHTML;

  if(r.strYoutube){
    const vidId=r.strYoutube.split("v=")[1];
    modalVideo.innerHTML=`<iframe src="https://www.youtube.com/embed/${vidId}" frameborder="0" allowfullscreen></iframe>`;
  } else { modalVideo.innerHTML="<p>No video available.</p>"; }

  setupStars();
  setupShare(r);
  modal.style.display="flex";
}

function setupStars(){
  const stars = modalStars.querySelectorAll("span");
  stars.forEach(s=>{ s.replaceWith(s.cloneNode(true)); });
  const newStars = modalStars.querySelectorAll("span");
  newStars.forEach(s=>{
    s.addEventListener("mouseover",()=>{ newStars.forEach(st=>st.classList.remove("hover")); for(let i=0;i<parseInt(s.dataset.value);i++) newStars[i].classList.add("hover"); });
    s.addEventListener("mouseout",()=>{ newStars.forEach(st=>st.classList.remove("hover")); });
    s.addEventListener("click",()=>{ newStars.forEach(st=>st.classList.remove("selected")); for(let i=0;i<parseInt(s.dataset.value);i++) newStars[i].classList.add("selected"); });
  });
}

function setupShare(r){
  const whatsapp = modal.querySelector(".whatsapp");
  const facebook = modal.querySelector(".facebook");
  const copylink = modal.querySelector(".copylink");
  const link = `https://www.themealdb.com/meal/${r.idMeal}`;

  whatsapp.onclick=()=>window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(link)}`,"_blank");
  facebook.onclick=()=>window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,"_blank");
  
  copylink.onclick=()=>{
    navigator.clipboard.writeText(link);
    copyPopup.classList.add("show");
    setTimeout(()=>{ copyPopup.classList.remove("show"); },1500);
  };
}

loadTrending();
