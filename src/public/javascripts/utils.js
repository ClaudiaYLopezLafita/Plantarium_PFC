//// FORMULARIO MULTI-PASO         
    var currentTab = 0; //tabs actual 0 al comenzar
    showTab(currentTab); 

    /**
     * Función que nos mostrará la pestaña "deseada"
     * */
    function showTab(n) {
        var x = document.getElementsByClassName("step");
        if(x!="undefined" && x!=undefined && x.length>0)
        {
            x[n].style.display = "block";
            // muestra o no los botones necesarios
            if (n == 0) {
                document.getElementById("prevBtn").style.display = "none";
            } else {
                document.getElementById("prevBtn").style.display = "inline";
            }
            if (n == (x.length - 1)) {
                document.getElementById("nextBtn").remove();
                let botonEnviar = document.createElement('button');
                
                // Configura los atributos y propiedades del botón
                botonEnviar.textContent = 'Enviar';
                botonEnviar.type = 'submit';
                let formFooter = document.querySelector('.form-footer');
                formFooter.appendChild(botonEnviar);
            } else {
                document.getElementById("nextBtn").innerHTML = "Next";
            }
            // controlamos la barra de progreso
            fixStepIndicator(n)
        }
    }

    /*
    Función que nos indicará que tabs mostrar
    */
    function nextPrev(n) {
    
    var x = document.getElementsByClassName("step");
    // salimos si n
    if (n == 1 && !acceptNextStep()) return false;
    // ocultamos la pestaña donde estamos
    x[currentTab].style.display = "none";
    // incrementamos la pestaña en uno
    currentTab = currentTab + n;
    // Si llegamos al final del formulario
    if (currentTab >= x.length) {
        // enviamos formulario
        document.getElementById("register_plant").submit();
        return false;
    }
    // Si no mostramos la pestaña actual
    showTab(currentTab);
    }

    /**
     * Aceptamos el paso al siguiente step
    */
    function acceptNextStep() {
    var x, y, i, valid = true;
    x = document.getElementsByClassName("step");
    y = x[currentTab].getElementsByTagName("input");

    if (valid) {
        document.getElementsByClassName("stepIndicator")[currentTab].className += " finish";
    }
    return valid; 
    }

    /**
     * FUnción que elima la clase que permite visializar pestañas
    */
    function fixStepIndicator(n) {
    var i, x = document.getElementsByClassName("stepIndicator");
    for (i = 0; i < x.length; i++) {
        x[i].className = x[i].className.replace(" active", "");
    }
    // agrega la clase activa solo en la pestaña actual
    x[n].className += " active";
    }