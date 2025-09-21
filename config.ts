
import {JsonFile} from "./File.js"
export const config=new JsonFile("./config.json")
config.init("servers",{
    default:{
        token:"",
        address:"http://localhost:80",
        performance:{
            type:"native"
        }
    }
})
config.init("port",8080)
export const port=config.get("port")