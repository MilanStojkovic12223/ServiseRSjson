//pocetak
let productsData=[];
let categoriesData=[];
let currentPagePagination = 1;

const PRODUCTS_PER_PAGE = 4;
const BASE_URL="assets/data/";
const CART_KEY="cartKey";
const USER_KEY="userKey";
const MAX_DISCOUNT = 3;
const MAX_REGULAR = 8;


function ajaxCallBack(fileName, onSuccess){
    $.ajax({
        url: BASE_URL + fileName,
        method: "get",
        dataType: "json",
        success: onSuccess,
        error: function(jqXHR, exception){
            let msg = "";
            if(jqXHR.status === 0){
                msg = "Not connect. Verify Network.";
            } else if(jqXHR.status == 404){
                msg = "Requested page not found. [404]";
            } else if(jqXHR.status == 500){
                msg = "Internal Server Error [500].";
            } else if(exception === "parsererror"){
                msg = "Requested JSON parse failed.";
            } else if(exception === "timeout"){
                msg = "Time out error.";
            } else if(exception === "abort"){
                msg = "Ajax request aborted.";
            } else {
                msg = "Uncaught Error: " + jqXHR.responseText;
            }
            console.log(msg);
        }
    });
}

window.onload =function(){
    onEvent();
    initializeCommonPage();
}

function initializeCommonPage(){
try{
    ajaxCallBack("menu.json", function(data){
    renderNavigation(data);
    });

    ajaxCallBack("footer.json",renderFooter);
    
    const htmlLocation = window.location.href;

    if(htmlLocation.includes("index.html") || window.location.pathname ==="/"){
        ajaxCallBack("services.json",renderServices);
        ajaxCallBack("associates.json",renderAssociates);
        discountTimer();
    }

    if(htmlLocation.includes("Komponente.html")){
        ajaxCallBack("categories.json",function(data){
            categoriesData =data;
            renderCategories();
        });
        ajaxCallBack("product.json",function(data){
            productsData = data;
            renderProduct();
            updateCartIcon();
            renderCart();
        });
    }
    if(htmlLocation.includes("Kontakti.html")){
        renderFormRadioButtons(arrComputerType);
        loadUser();
    }
    if(htmlLocation.includes("Korpa.html")){
         ajaxCallBack("product.json",function(data){
            productsData = data;
            updateCartIcon();
            renderCart();
        });
    }
    }catch(error){
        console.error("Greška u initializeCommonPage:", error);
        alert("Došlo je do greške prilikom učitavanja stranice.");
    }
   

}
//navigacija
function renderNavigation(arrMenu){
    let navigationHTML = `<ul class="navbar-nav">`;
    for(let objMenu of arrMenu){
        navigationHTML +=`<li class="nav-item">
                  <a ${menuPositioning(objMenu.href)} aria-current="page">${objMenu.name}</a>
                </li>`;
    }
    navigationHTML += `</ul>`;
    document.getElementById('navbarNav').innerHTML = navigationHTML;
}

function menuPositioning(menuUrl){

   const currentPath = window.location.pathname;

    
    const isActive = currentPath.includes(menuUrl) || (currentPath === "/" || currentPath.endsWith("/ServiseRSjson/")) && menuUrl === "index.html";

    return `class="nav-link ${isActive ? "active" : ""}" href="${isActive ? "#" : menuUrl}"`;
}

//footer

function renderFooter(arrFooter){
    let footerHtml ="";
    for(let objFooter of arrFooter){
        footerHtml+=`<a class="text-white" target="_blank" href="${objFooter.href}"><i class="${objFooter.icon}"></i></a>`;
    }
    document.getElementById("footerID").innerHTML =footerHtml;
}

//Komponente.html

//prikaz kategorija
function renderCategories(){
    const start = $("#componentsFilter");
    categoriesData.forEach(element =>{
        start.append(`<option value="${element.name}">${element.name}</option>`);
    })
}
//prikaz delova
function renderProduct(){
    const container = $("#products");
    const noResults = $("#noResults");

    container.empty();

    var filteredProducts =getFilter();
    filteredProducts = getSort(filteredProducts);

    if(filteredProducts.length === 0){
        noResults.removeClass("hidden");
        document.getElementById("pagination").innerHTML = "";
        currentPagePagination = 1;
        return;
    }
        noResults.addClass("hidden");

    const startIndex = (currentPagePagination - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    const productsForPage = filteredProducts.slice(startIndex, endIndex);

    var productHtml ="";
    productsForPage.forEach(objProduct =>{
        productHtml+=`<div class="col-12 col-lg-3 col-md-6 col-sm-12  mb-4">
                                    <div class="card d-flex flex-column h-100 mx-auto mc-bg-gray1 text-center">
                                        <img class="card-img-top" src="${objProduct.img}" alt="${objProduct.name}">
                                        <h5>${objProduct.name}</h5>
                                        ${getPriceHtml(objProduct.price,objProduct.discount)}
                                        <button type="submit" class="btn btn-md mx-3 my-3 bg-dark text-white mt-auto btn-add-cart-item" data-id="${objProduct.id}">Poruči</button>
                                    </div>
                        </div>`;
    });
    document.getElementById("products").innerHTML =productHtml;
    renderPagination(filteredProducts.length);
}

function getPriceWithDiscount(price, discount){
    if (discount === 0) {
        return price;
    }
    return price - (price * discount / 100)
}

function getPriceHtml(price, discount){

    if(discount===0){
        return `<p class="regular-price">${price.toLocaleString('de-DE')} RSD</p>`;
    }
    
    else{
        const priceWithDiscount = getPriceWithDiscount(price, discount);
        return `<p class="price-old">${price.toLocaleString('de-DE')} RSD</p>
               <p class="discount-price">${priceWithDiscount.toLocaleString('de-DE')} RSD</p>
               <p class="discount">-${discount}%</p>`;
    }
}

// filter i sort
function onEvent(){
    $("#searchInput").on("input", function (){
        currentPagePagination = 1;
        renderProduct();
    });
    $("#componentsFilter").on("change", function (){
        currentPagePagination = 1;
        renderProduct();
    });
    $("#selectSort").on("change", function (){
        currentPagePagination = 1;
        renderProduct();
    });
    //regex
    $("#SubmitBut").on('click', function(event) {
        event.preventDefault();
        validateRegex();
        
    });
    //paginacija
    $(document).on("click", ".btn-page", function(){
        currentPagePagination = parseInt($(this).data("page"));
        renderProduct();
    });

    //dodavanje u korpu
    $(document).on("click", ".btn-add-cart-item", function(){
        adToCart(parseInt($(this).data("id")));
        updateCartIcon();
        renderCart();
    });
    //brisanje iz korpte dugme
    $(document).on("click", ".btn-delete", function(){
        deleteItem(parseInt($(this).data("id")));
    });

}

function getFilter(){
    const searchInput = $("#searchInput").val().trim().toLowerCase();
    const searchComponents = $("#componentsFilter").val();
    

    return productsData.filter(function(products){
        const returnInput = products.name.toLowerCase().includes(searchInput);
        const returnComponents = searchComponents === "all" || searchComponents === products.type;

        return returnInput && returnComponents;
    })
}

function getSort(products){
    const sortType =$("#selectSort").val();
    const arrNewProducts = [...products];

    arrNewProducts.sort(function(a,b){

        if( sortType==="title-asc"){
            return a.name.localeCompare(b.name);
        }
        if( sortType==="price-asc"){
            return  getPriceWithDiscount(a.price,a.discount) - getPriceWithDiscount(b.price,b.discount);
        }
        if( sortType==="price-desc"){
            return getPriceWithDiscount(b.price,b.discount) - getPriceWithDiscount(a.price,a.discount);
        }
        if( sortType==="discount-desc"){
            return b.discount - a.discount;
        }
        
        return a.id -b.id;
    });
    return arrNewProducts;
}

//paginacija
function renderPagination(productNumber){
    const totalPages = Math.ceil(productNumber / PRODUCTS_PER_PAGE);
    let paginationHtml ="";
    if(totalPages <=1){
        document.getElementById("pagination").innerHTML ="";
        return;
    }
    for(let i = 1; i <= totalPages; i++){
        paginationHtml += `<button class="btn btn-sm mb-3 mx-1 ${i === currentPagePagination ? "btn-dark" : "btn-outline-dark"} btn-page" data-page="${i}">
                    ${i}
                 </button>`;
    }
    document.getElementById("pagination").innerHTML = paginationHtml;
}

//ls

function saveLs(key, value){
    localStorage.setItem(key, JSON.stringify(value));
}

function getLs(key){
    const data = localStorage.getItem(key);
    if(!data) return [];
    try{
        return JSON.parse(data);
    }
    catch(error){
        console.error("Greška prilikom parsiranja Local Storage-a za ključ: " + key, error);
        return [];
    } 
}

//korisnici
function getUsers() {
    return getLs(USER_KEY) || [];
}

function saveUserData(){
    const users = getUsers();
    const userData ={
        name: checkName.value.trim(),
        surname: checkSurname.value.trim(),
        email: checkEmail.value.trim(),
        phone: checkPhone.value.trim()
    }
    const exists = users.some(user => user.email === userData.email);
    if(exists){
        console.log("Korisnik sa ovim emailom već postoji!");
        return;
    }
    users.push(userData);
    saveLs(USER_KEY, users);
    
    console.log(JSON.parse(localStorage.getItem(USER_KEY)));
    console.log("sacuvan user");
}

function loadUser(){
    console.log(JSON.parse(localStorage.getItem(USER_KEY)));
    const user = getLs(USER_KEY) || [];
    if(user.length){
        const userData = user[user.length - 1];
        checkName.value = userData.name;
        checkSurname.value = userData.surname;
        checkEmail.value = userData.email;
        checkPhone.value = userData.phone;
    }
}

//korpa
function getCart(){
    return getLs(CART_KEY) || [];
}
function saveCartData(cart){
    saveLs(CART_KEY, cart);
}

function adToCart(getId){
    let items = getCart();
    let exists = items.find(item => item.productID === getId);
    let product = productsData.find(p => p.id === getId);

    if(exists){
        if(product.discount > 0){
            if(exists.quantity >=MAX_DISCOUNT){
                alert("Maksimalna kolicina za proizvode na popustu je " + MAX_DISCOUNT);
                return;
            }
        }
        else if(product.discount === 0){
            if(exists.quantity >=MAX_REGULAR){
                alert("Maksimalna kolicina za ovaj proizvod je "+ MAX_REGULAR);
                return;
            }
        }
        exists.quantity+=1;
    }
    else{
        items.push({
            productID: getId,
            quantity: 1
        });
        }
        saveCartData(items);
        renderCart(); 
}

function updateCartIcon(){
    let cart = getCart();
    let sum = 0;
    for(let i = 0; i < cart.length; i++){
        sum += cart[i].quantity;
    }
    let counter = document.getElementById("cartCounter");
    if(counter){
        counter.textContent = sum;
    }
    console.log(JSON.parse(localStorage.getItem(CART_KEY)));
}

//korpa.html
function renderCart(){
    const cartDiv = document.getElementById("cartDiv");
    if(!cartDiv){
        return;
    }

    let cart = getCart();
    if(cart.length === 0){
        cartDiv.innerHTML = `<p class="alert text-center">Korpa je prazna.</p>`;
        return;
    }

    let total = 0;
    let cartHtml = `
        <table class="table">
            <thead>
                <tr>
                    <th>Proizvod</th>
                    <th class="text-end">Cena po jedinici</th>
                    <th class="text-center">Količina</th>
                    <th class="text-end">Ukupno</th>
                    <th class="text-end">Ukloni sa liste</th>
                </tr>
            </thead>
            <tbody>
    `;

    for(let obj of cart){
        let item = productsData.find(e => e.id === obj.productID);
        if(!item) continue;

        let priceWithDiscount = getPriceWithDiscount(item.price, item.discount);
        let totalPerItem = priceWithDiscount * obj.quantity;
        total += totalPerItem;

        cartHtml += `
            <tr>
                <td>${item.name}</td>
                <td class="text-end">${priceWithDiscount.toLocaleString('de-DE')} RSD</td>
                <td class="text-center">${obj.quantity}</td>
                <td class="text-end">${totalPerItem.toLocaleString('de-DE')} RSD</td>
                <td class="text-end">
                    <button class="btn btn-outline-danger btn-sm btn-delete" data-id="${item.id}">Obriši</button>
                </td>
            </tr>
        `;
    }

    cartHtml += `
            </tbody>
        </table>
        <div class="text-end">
            <h4>Ukupno: ${total.toLocaleString('de-DE')} RSD</h4>
            
        </div>
    `;

    cartDiv.innerHTML = cartHtml;
}

    function deleteItem(id){
        var items = getCart().filter(e=> e.productID !== id);
        saveLs(CART_KEY, items);
        renderCart();
        updateCartIcon();
    }

//index.html

//usluge

function renderServices(arrService){
     var serviceHtml ="";
    arrService.forEach(objService =>{
        serviceHtml+=`<div class="col-12  col-lg-3 col-md-6 col-sm-12  mb-4">
                        <div class="card h-100 mx-auto mc-bg-gray1 text-center p-5">
                            <div class="mc-icon-size mx-auto ">
                            <i class="${objService.icon}"></i>
                            </div>
                            <h4>${objService.title}</h4>
                            <p>${objService.text}</p>
                        </div>
                    </div>`;
    });
    document.getElementById("serviceType").innerHTML =serviceHtml;
}

//brendovi
function renderAssociates(arrAssociates){
     var associatesHtml ="";
    arrAssociates.forEach(objAssociates =>{
        associatesHtml+=`<div class="col-12  col-lg-3 col-md-6 col-sm-12 mb-4">
                        <div class="card h-100 mx-auto mc-bg-gray1 text-center">
                            <a href="${objAssociates.href}"><img src="${objAssociates.img}" class="w-100" alt="${objAssociates.alt}"></a>
                        </div>
                    </div>`;
    });
    document.getElementById("brandsId").innerHTML =associatesHtml;
}


//tajmer
function discountTimer(){
    const TIMER_DATE = new Date("Apr 28, 2026 23:59:59").getTime();

    setInterval(function(){
    let todaysDate =  new Date().getTime();
    let timeBetween = TIMER_DATE - todaysDate;

    let days = Math.floor(timeBetween / (1000 * 60 * 60 * 24));
    let hours = Math.floor((timeBetween % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((timeBetween % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((timeBetween % (1000 * 60)) / 1000);
    if(document.getElementById('timerId')){
        document.getElementById('timerId').innerHTML = days + "d " + hours + "h " + minutes + "m " + seconds + "s"; 
    }
        
},1000);
}

//Kontakti.html

//ispis radio button-a
let arrComputerType = ["Desktop","Laptop"];

function renderFormRadioButtons(arrComputerType){
    let radioButtonHtml ="";
    arrComputerType.forEach(element =>{
        radioButtonHtml+=`<div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="Racunar" id="${element}" value="${element}">
                        <label class="form-check-label" for="${element}">${element} računar</label>
                        </div>`;
    })
    document.getElementById("computerType").innerHTML=radioButtonHtml;
}

//forma

//hvatanje potrebnih elemenata
const checkName =document.getElementById('name');
const checkSurname =document.getElementById('surname');
const checkEmail =document.getElementById('email');
const checkPhone =document.getElementById('phone');

const submitButton = document.getElementById('SubmitBut');

const nameError =document.getElementById('nameErrMsg');
const surnameError =document.getElementById('surnameErrMsg');
const emailError =document.getElementById('emailErrMsg');
const phoneError =document.getElementById('phoneErrMsg');
const computerTypeError = document.getElementById('computerTypeErrMsg');


//regex
const REGEX_PHONE = /^(\+)?[0-9]{7,15}$/;
const REGEX_EMAIL = /^[\w\d\.]+@[\w\d\.]+\.[a-zA-Z\d]{2,}$/;
const REGEX_NAME =/^[A-ZŠĆČŽĐ][a-zčćžšđ]{1,9}$/;

//provera unosa

function validateField(value, regex, errorElement, message) {
    if (!regex.test(value)) {
        errorElement.textContent = message;
        errorElement.style.color = 'red';
        return false;
    } else {
        errorElement.textContent = '';
        return true;
    }
}

function validateRegex() {
    let isValid = true;

    // Ime
    if (!validateField(checkName.value, REGEX_NAME, nameError, 'Ime mora da počinje velikim slovom!')) {
        isValid = false;
    }

    // Prezime
    if (!validateField(checkSurname.value, REGEX_NAME, surnameError, 'Prezime mora da počinje velikim slovom!')) {
        isValid = false;
    }

    // Email
    if (!validateField(checkEmail.value, REGEX_EMAIL, emailError, 'Email nije tačan! Primer: petar@gmail.com')) {
        isValid = false;
    }

    // Telefon
    if (!validateField(checkPhone.value, REGEX_PHONE, phoneError, 'Morate da unesete 7-15 brojeva, može da počne sa +')) {
        isValid = false;
    }

    // Vrsta računara
    const selectedComputer = document.querySelector('input[name="Racunar"]:checked');
    if (!selectedComputer) {
        computerTypeError.textContent = 'Morate da izaberete jednu opciju!';
        computerTypeError.style.color = 'red';
        isValid = false;
    } else {
        computerTypeError.textContent = '';
    }

    // Ako je sve validno
    if (isValid) {
        saveUserData();
    }
}

