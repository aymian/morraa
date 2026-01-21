import react from "react";

function clos () {
    const cols = document.getElementById("cols");

    if (cols === 1){
        console.log("cols is not null");
    } else {
        console.log ("colls is a null");
    }
}

clos();