// import{
//     numPlantForCategorie
// } from '../../routes/query_graphic'

const{ numPlantForCategorie } = require('../../routes/query_graphic')


// definimos donde colocar las gráficas
const ctx1 = document.getElementById('categoriaPlanta'); //categoriaPlanta



/* 1. CATEGORIAS */

const categories = ["Caduca", "Carnivora", "Con Flor", "Exótica", "Exterior", "Herbácea", 
"Interior", "Leñosa", "Perenne", "Sin Flor","Suculenta"]

 // Datos de la gráfica

const datosCategorie ={
    data: numPlantForCategorie, 
    backgroundColor: [
        '#EA6988',
        '#D55D92',
        '#C05299',
        '#AC46A1',
        '#973AA8',
        '#822FAF',
        '#6D23B6',
        '#6411AD',
    ],// Color de fondo
    borderColor: [
        '#EA6988',
        '#D55D92',
        '#C05299',
        '#AC46A1',
        '#973AA8',
        '#822FAF',
        '#6D23B6',
        '#6411AD',
    ],// Color del borde
    borderWidth: 1,// Ancho del borde
};

new Chart(ctx1, {
    type: 'dougnhut',// Tipo de gráfica. Puede ser dougnhut o pie
    data: {
        labels: categories,
        datasets: [
            datosCategorie,
        ]
    },
    options:{
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            title: {
                display: true,
                text: 'Nº de plantas por Categoría',
                font: {
                    size: 30
                }
            },
            subtitle: {
                display: true,
                text: 'Segun la categoría',
                font: {
                    size: 15
                }
            }
        },
        animateRotate:true,
        animateScale:true,
        layout: {
            auropadding:true
        }
    }
});


/* 2. TOP CINCO DE PLANTAS MÁS AÑADIDAS  */
