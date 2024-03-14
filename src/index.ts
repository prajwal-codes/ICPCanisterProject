import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express from 'express';

class Courier {
    id: string;
    sender: string;
    receiver: string;
    status: string; // can be 'sent', 'received', 'dispatched'
    createdAt: Date;
    updatedAt: Date | null;
 }
 
 const couriersStorage = StableBTreeMap<string, Courier>(0);
 
 export default Server(() => {
    const app = express();
    app.use(express.json());
 
    app.post("/couriers", (req, res) => {
       const courier: Courier = { id: uuidv4(), createdAt: getCurrentDate(), ...req.body };
       couriersStorage.insert(courier.id, courier);
       res.json(courier);
    });
 
    app.get("/couriers", (req, res) => {
       res.json(couriersStorage.values());
    });
 
    app.get("/couriers/:id", (req, res) => {
       const courierId = req.params.id;
       const courierOpt = couriersStorage.get(courierId);
       if ("None" in courierOpt) {
          res.status(404).send(`Courier with id=${courierId} not found`);
       } else {
          res.json(courierOpt.Some);
       }
    });
 
    app.put("/couriers/:id", (req, res) => {
       const courierId = req.params.id;
       const courierOpt = couriersStorage.get(courierId);
       if ("None" in courierOpt) {
          res.status(400).send(`Couldn't update courier with id=${courierId}. Courier not found`);
       } else {
          const courier = courierOpt.Some;
          const updatedCourier = { ...courier, ...req.body, updatedAt: getCurrentDate() };
          couriersStorage.insert(courier.id, updatedCourier);
          res.json(updatedCourier);
       }
    });
 
    app.delete("/couriers/:id", (req, res) => {
       const courierId = req.params.id;
       const deletedCourier = couriersStorage.remove(courierId);
       if ("None" in deletedCourier) {
          res.status(400).send(`Couldn't delete courier with id=${courierId}. Courier not found`);
       } else {
          res.json(deletedCourier.Some);
       }
    });
 
    return app.listen();
 });
 
 function getCurrentDate() {
    const timestamp = new Number(ic.time());
    return new Date(timestamp.valueOf() / 1000_000);
 }