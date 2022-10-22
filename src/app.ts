import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import swaggerUi from 'swagger-ui-express';
import path from "path";
import formData from "express-form-data";
import os from "os";

import logIt from "./utils/logit.util";
import database from "./utils/dbconnection.util";
import IController from "./interfaces/controller.interface";
import routeProtectionMiddleware from "./middlewares/routeProtection.middleware";
import healthCheckMiddleware from "./middlewares/healthCheck.middleware";
import { options } from "./docs/options";
import * as errorHandler from "./middlewares/errorHandler.middleware";
import { constents } from "./configs/constents.config";
import { CronManager } from "./jobs/cronManager";
import DashboardMapStatsJob from "./jobs/dashboardMapStats.jobs";
import BadgesJob from "./jobs/badges.jobs";
import { translationMiddleware } from "./middlewares/translation.middleware";
import TranslationService from "./services/translation.service";
import http, { request } from "http";
import axios from "axios";
// import fs from 'fs';
// import BadgesJob from "./jobs/badges.jobs";
// import https from 'https'

export default class App {
    public app: Application;
    public port: number;
    public db: any;

    constructor(controllers: IController[], port: number) {
        this.app = express();
        this.port = port;
        this.increaseSimulatenousHttpSockets();
        this.initializeMiddlewares();
        this.initializeHomeRoute();
        this.serveStaticFiles();
        this.initializeDocs();
        this.initializeHealthCheck();
        // this.initializeRabitMqBroker();
        this.doLogIt(constents.log_levels.list.INBOUND);
        this.initializeRouteProtectionMiddleware();
        ///make sure translation middleware is called after route protection middleware because
        // translation middleware adds data to res.locals which is overidden in route protection middleware
        this.initializeTranslations();
        this.initializeControllers(controllers, "/api", "v1");
        this.doLogIt(constents.log_levels.list.OUTBOUND);
        this.initializeErrorHandling();//make sure this is the last thing in here 
        this.initializeDatabase();
        this.initializeJobs();
    }

    private increaseSimulatenousHttpSockets() {
        // http.globalAgent.maxSockets = 100;
        // You could also set it to unlimited (Node v0.12 does by default):
        http.globalAgent.maxSockets = Infinity;
    }
    private doLogIt(flag: string) {
        this.app.use(async (req: Request, res: Response, next: NextFunction) => {
            await logIt(flag, ((flag == constents.log_levels.list.INBOUND) ? "Inbound request" : "Outbound response"), req, res);
            next();
        });
    }

    private initializeDatabase(): void {
        console.log('name', process.env.DB_NAME, 'user', process.env.DB_USER)
        database.sync()
            .then(async () => {
                await logIt(constents.log_levels.list.INFO, "Connected to the Database successfully");
            })
            .catch(async (e: any) => {
                await logIt(constents.log_levels.list.ERROR, `DB CONNECTIVITY ERROR: Message: ${e}.`);
                await logIt(constents.log_levels.list.ERROR, `Terminating the process with code:1, due to DB CONNECTIVITY ERROR.`);
                process.exit(1);
            });
    }

    private initializeJobs(): void {
        const cronManager = CronManager.getInstance()
        // cronManager.addJob(new BadgesJob());
        cronManager.addJob(new DashboardMapStatsJob())
        // new DashboardMapStats().executeJob()
        cronManager.startAll();
    }

    private initializeMiddlewares(): void {
        // helmet for secure headers
        this.app.use(helmet({
            crossOriginResourcePolicy: false,
        }));
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ limit: '50mb', extended: true }));
        // this.app.use(express.json());
        // this.app.use(express.urlencoded({ extended: true }));
        this.app.use(formData.parse({
            uploadDir: os.tmpdir(),
            autoClean: true
        }));
        // compression for gzip
        this.app.use(compression());

        this.app.use(translationMiddleware)
    }

    private initializeHomeRoute(): void {
        this.app.get("/", (req: Request, res: Response, next: NextFunction) => {
            const resData = {
                status: 200,
                status_type: "success",
                apis: {
                    docks: `https://${process.env.APP_HOST_NAME}:${process.env.APP_PORT}/docs`,
                    apis: `https://${process.env.APP_HOST_NAME}:${process.env.APP_PORT}/api/v1`,
                    healthcheck: `https://${process.env.APP_HOST_NAME}:${process.env.APP_PORT}/healthcheck`,
                },
            }
            res.status(resData.status).send(resData).end();
        });
    }

    private serveStaticFiles(): void {
        this.app.use("/assets", express.static(path.join(process.cwd(), 'resources', 'static', 'uploads')));
        this.app.use("/assets/defaults", express.static(path.join(process.cwd(), 'resources', 'static', 'uploads', 'default')));
        this.app.use("/posters", express.static(path.join(process.cwd(), 'resources', 'static', 'uploads', 'posters')));
        this.app.use("/images", express.static(path.join(process.cwd(), 'resources', 'static', 'uploads', 'images')));
        this.app.use("/assets/courses", express.static(path.join(process.cwd(), 'resources', 'static', 'uploads', 'courses')));
        this.app.use("/assets/reflectiveQuiz", express.static(path.join(process.cwd(), 'resources', 'static', 'uploads', "reflective_quiz")));
    }

    private initializeDocs(): void {
        this.app.use("/docs", swaggerUi.serve, swaggerUi.setup(options));
        this.app.use("/docs.json", (req: Request, res: Response, next: NextFunction) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(options);
            next();
        });
    }

    private initializeHealthCheck(): void {
        this.app.get("/healthcheck", healthCheckMiddleware);
    }

    // private initializeRabitMqBroker(): void {
    //     amqp.connect(process.env.RABBITMQ_URL || '', (err: any, conn: any) => {
    //         if (err) {
    //             logIt(constents.log_levels.list.ERROR, `RabbitMQ CONNECTIVITY ERROR: Message: ${err}.`);
    //             logIt(constents.log_levels.list.ERROR, `Termianting the process with the code:1 due to RabbitMQ CONNECTIVITY ERROR.`);
    //             process.exit(1);
    //         }
    //         conn.createChannel((chErr: any, ch: any) => {
    //             if (err) {
    //                 logIt(constents.log_levels.list.ERROR, `RabbitMQ CONNECTIVITY ERROR: Message: ${err}.`);
    //                 logIt(constents.log_levels.list.ERROR, `Termianting the process with the code:1 due to RabbitMQ CONNECTIVITY ERROR.`);
    //                 process.exit(1);
    //             }
    //             ch.assertQueue(process.env.RABBITMQ_QUEUE, { durable: process.env.RABBITMQ_QUEUE_DURABLE === 'true' });
    //             let i =0;
    //             // setInterval(() => {
    //                 ch.sendToQueue(process.env.RABBITMQ_QUEUE, Buffer.from(`This is the message ${++i}`));
    //             // }, 1000);
    //             console.log(" [x] Sent 'Hello World!'");
    //         });
    //     });
    // }

    private initializeRouteProtectionMiddleware(): void {
        // this.app.use(routeProtectionMiddleware);
    }

    private initializeTranslations() {
        const translationService = new TranslationService(constents.translations_flags.default_locale, true)
        this.app.use(translationMiddleware)
    }

    private initializeControllers(controllers: IController[], prefix: string = "/api", version: string = "v1"): void {
        controllers.forEach((controller: IController) => {
            this.app.use(`${prefix}/${version}`, controller.router);
        });
    }

    private initializeErrorHandling(): void {
        // Error Middleware
        this.app.use(errorHandler.genericErrorHandler);
        this.app.use(errorHandler.notFound);

        // Catch unhandled rejections
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            process.on('UnhandledRejection', async err => {
                await logIt(constents.log_levels.list.ERROR, `Unhandled rejection. Error-object: ${err}`);
                res.send(err).end()
            });
        });

        // Catch uncaught exceptions
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            process.on('Uncaught exception', async err => {
                ;
                await logIt(constents.log_levels.list.ERROR, `Uncaught exception. Error-object: ${err}`);
                res.send(err).end()
            });
        });
    }

    private showRoutes(): void {
        var route, routes: any[] = [];
        this.app._router.stack.forEach(function (middleware: any) {
            if (middleware.route) { // routes registered directly on the app
                routes.push(middleware.route);
            } else if (middleware.name === 'router') { // router middleware 
                middleware.handle.stack.forEach(function (handler: any) {
                    route = handler.route;
                    route && routes.push(route);
                });
            }
        });
        console.log(
            `=================================================================
Available Routes:
=================================================================`);
        console.log(`Base Path: http://localhost:${this.port}/api/v1`);
        console.log(`Course Images: http://localhost:${this.port}/courses`);
        console.log(`Poster Images: http://localhost:${this.port}/posters`);
        console.log(`Standard Images: http://localhost:${this.port}/images`);
        console.table(routes);
    }

    public listen(): void {
        this.app.listen(this.port, async () => {
            await logIt(constents.log_levels.list.INFO, `App is running at http://${process.env.APP_HOST_NAME}:${this.port}`);
            if (process.env.SHOW_ROUTES === "true") {
                this.showRoutes();
            }
        });
    }

}