const express = require('express')
const pdf = require('pdf-creator-node')
const fs = require('fs')
const path = require('path')
const mail = require('./mail.js')
require('dotenv').config()

const app = express()
const port = process.env.SERVICE_PORT

// inicializamos mail
let transporter = mail.transporter

// uso de imagenes
let imgs = {}

const directoryPath = path.join(__dirname, 'img')

fs.readdir(directoryPath, function(err, files) {
  if(err) {
    console.log('Unable to scan directory: '+ err)
  }

  files.forEach(function (file) {
    const bitmap = fs.readFileSync(__dirname+'/img/'+file)
    const img = bitmap.toString('base64')
    const fileName = file.split('.')[0]
    imgs[fileName] = img
  })
})

app.use(express.json())
app.use(express.urlencoded())

app.post('/api/menu/pdf', (req, res) => {
  const data = req.body
  let mailOptions = mail.mailOptions

  let imagenes_comida = {}
  let imagenes_cena = {}
  let comida = {}
  let cena = {}
  let total = {}
  let resto = {}

  for(let i = 0; i<data.imagenes_comida.length; i++){
    imagenes_comida['i'+i] = data.imagenes_comida[i] 
  }

  for(let i = 0; i<data.imagenes_cena.length; i++){
    imagenes_cena['i'+i] = data.imagenes_cena[i] 
  }

  for(let i = 0; i<data.comida.length; i++){

    let newData = {}

    for(let x = 0; x<data.comida[i].length; x++){
      newData['x'+x] = data.comida[i][x]
    }

    comida['i'+i] = newData 

  }

  for(let i = 0; i<data.cena.length; i++){

    let newData = {}

    for(let x = 0; x<data.cena[i].length; x++){
      newData['x'+x] = data.cena[i][x]
      total['i'+i] = parseInt(data.comida[i][x].calorias) + parseInt(data.cena[i][x].calorias)
      resto['i'+i] = data.calorias_propuestas - total['i'+i]
    }

    cena['i'+i] = newData 

  }
  // read mail template
  let mail_html = fs.readFileSync('./email/index.html', 'utf-8')

  // read HTML template
  let html = fs.readFileSync('./pdf/index.html', 'utf-8')

  // custom pdf options
  let options = {
    format: 'A4',
    orientation: 'landscape'
  }

  // data to pdf
  let date = Date.now()
  let document = {
    html: html,
    data: {
      imgs: imgs,
      calorias_propuestas: data.calorias_propuestas,
      nombre: data.nombre,
      edad: data.edad,
      peso: data.peso,
      altura: data.altura,
      sexo: data.sexo,
      nivel_ejercicio: data.nivel_ejercicio,
      objetivo: data.objetivo,
      comida: comida,
      cena: cena,
      imagenes_comida: imagenes_comida,
      imagenes_cena: imagenes_cena,
      total: total,
      resto: resto
    },
    path: `./output/${date}.pdf`,
    type: ''
  }

  // create pdf
  pdf.create(document, options)
  .then((result) => {

    mailOptions.to = data.email
    mailOptions.subject = 'Mist Meals - Menú'
    mailOptions.html = mail_html
    mailOptions.attachments[0].path = __dirname+`/output/${date}.pdf` 

    // send mail with pdf
    transporter.sendMail(mailOptions, (err, data) => {
      if(err) {
        console.log('Err: ' + err)
        res.status(401).json({error: 'Error al enviar el email'})
      } else {
        console.log('Email enviado sactifactoriamente a '+ mailOptions.to)
        res.status(200).json({message: 'Correo enviado satisfactoriamente'})
        // remove pdf
        fs.unlink(document.path, (err) => {
          if(err) {
            console.log(err)
            return
          }
          console.log('Archivo eliminado correctamente')
        })
      }
    })
  })
  .catch((error) => {
    res.status(401).json({error: 'Error al crear el pdf'})
  })
})

app.listen(port, () => {
  console.log(`Api escuchando en el puerto ${port}`)
})
