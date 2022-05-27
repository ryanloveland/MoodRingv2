
mybtn = document.getElementById("myTestButton")

mybtn.addEventListener("click", myfunc = () => {
    console.log("You have clicked!")
    mybtn.style["background-color"] = "green";
})
//This works