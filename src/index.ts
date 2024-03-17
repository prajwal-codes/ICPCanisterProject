import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express, { Request, Response } from 'express';

// Define a type for courier status
enum CourierStatus {
    SENT = 'sent',
    RECEIVED = 'received',
    DISPATCHED = 'dispatched'
}

class Courier {
    id: string;
    sender: string;
    receiver: string;
    status: CourierStatus;
    createdAt: Date;
    updatedAt: Date | null;
}

const couriersStorage = StableBTreeMap<string, Courier>(0);

export default Server(() => {
    const app = express();
    app.use(express.json());

    app.post("/couriers", (req: Request, res: Response) => {
        const { sender, receiver, status } = req.body;

        // Validate request body
        if (!sender || !receiver || !status || !Object.values(CourierStatus).includes(status)) {
            return res.status(400).json({ error: 'Invalid or missing fields in the request body' });
        }

        const courier: Courier = { id: uuidv4(), createdAt: getCurrentDate(), ...req.body };
        couriersStorage.insert(courier.id, courier);
        res.json(courier);
    });

    app.get("/couriers", (req: Request, res: Response) => {
        // Pagination logic here
        // Example: const page = parseInt(req.query.page as string);
        //          const pageSize = parseInt(req.query.pageSize as string);
        //          const startIndex = (page - 1) * pageSize;
        //          const couriersPage = couriersStorage.values().slice(startIndex, startIndex + pageSize);
        res.json(couriersStorage.values());
    });

    app.get("/couriers/:id", (req: Request, res: Response) => {
        const courierId = req.params.id;
        const courierOpt = couriersStorage.get(courierId);
        if ("None" in courierOpt) {
            res.status(404).send(`Courier with id=${courierId} not found`);
        } else {
            res.json(courierOpt.Some);
        }
    });

    app.put("/couriers/:id", (req: Request, res: Response) => {
        const courierId = req.params.id;
        const courierOpt = couriersStorage.get(courierId);
        if ("None" in courierOpt) {
            res.status(400).send(`Couldn't update courier with id=${courierId}. Courier not found`);
        } else {
            const courier = courierOpt.Some;
            const updatedCourier: Partial<Courier> = { ...courier, ...req.body, updatedAt: getCurrentDate() };
            couriersStorage.insert(courier.id, { ...courier, ...updatedCourier });
            res.json(updatedCourier);
        }
    });

    app.delete("/couriers/:id", (req: Request, res: Response) => {
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
