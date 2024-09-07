const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


async function connect() {
  await mongoose
  .connect("mongodb+srv://kokokara:kokokara@cluster0.20jje.mongodb.net/exercise-project?retryWrites=true&w=majority&appName=Cluster0")
  .then(()=>console.log("connected w the cluster"))
  .catch((e)=>console.log("cant connect : ", e))
}

connect()

const schema = mongoose.Schema({
  username: String,
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: String,
  }]
})

const model = mongoose.model("datas", schema)

app.post("/api/users", express.urlencoded(), (req,res)=>{ //aman
  const doc = new model({
    username: req.body.username,
    count: 0,
    log: []
  })
  
  doc
    .save()
    .then(result=>res.json({
      _id:result._id,
      username: result.username,
    }))
    .catch(e=>console.log("error : "+ e))
})

app.get("/api/users", async (req,res)=>{
  const data = await model.find()
  res.json(data.map(e=>{
    return{
      _id:e._id,
      username:e.username,
      __v:e.__v
    }
  }).filter(e=>e!=null))
})

app.post("/api/users/:_id/exercises", express.urlencoded(), async (req,res)=>{ //aman
  const data = await model.findById(req.params._id)

  data.count = data.log.length +1
  data.log.push({
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date? new Date(req.body.date).toDateString(): new Date()
  })

  data
    .save()
    .then(result=>res.json({
      _id:result._id,
      username: result.username,
      description: result.log[result.log.length-1].description,
      duration: result.log[result.log.length-1].duration,
      date: result.log[result.log.length-1].date
  
    }))
    .catch(e=>console.log("error : "+ e))

  
})


app.get("/api/users/:_id/logs", async (req,res)=>{
  const data = await model.findById(req.params._id)
  let {from, to, limit} = req.query
  
  if(!from && !to && !limit){
    res.json({
      _id:data._id,
      username: data.username,
      count: data.count,
      log:data.log.map(e=>{
        return {
          description: e.description,
          duration: e.duration,
          date: new Date(e.date).toDateString()
        }
      })
    })
  }else{
    let log = data.log
    .filter((e)=>(from?new Date(from).getTime():-99999999999)<=new Date(e.date).getTime() && (to?new Date(to).getTime():999999999999) >=new Date(e.date).getTime())
    .slice(0,limit?limit:99999)
    .map(e=>{
      return({
        description: e.description,
        duration: e.duration,
        date: e.date
      })
    })
    res.json({
      _id:data._id,
      username: data.username,
      count: log.length,
      log
    })
  }

})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
