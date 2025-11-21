
import * as amqp from "amqplib";
import dotenv from "dotenv";

dotenv.config();

let connection: any = null; 
let channel: amqp.Channel | null = null;

export async function getChannel(): Promise<amqp.Channel> {
  if (channel) return channel;

  const type = process.env.AMQP_CONNECTION_TYPE; 

  if (!connection) {
    if (type === "cloud") {
      connection = await amqp.connect({
        protocol: process.env.AMQP_CLOUD_PROTOCOL, 
        hostname: process.env.AMQP_CLOUD_HOST,
        port: Number(process.env.AMQP_CLOUD_PORT),
        username: process.env.AMQP_CLOUD_USER,
        password: process.env.AMQP_CLOUD_PASS,
        vhost: process.env.AMQP_CLOUD_VHOST,
      });
      console.log("🐇 Conexión CloudAMQP creada");
    } else {
      connection = await amqp.connect({
        protocol: process.env.AMQP_LOCAL_PROTOCOL, 
        hostname: process.env.AMQP_LOCAL_HOST,
        port: Number(process.env.AMQP_LOCAL_PORT),
        username: process.env.AMQP_LOCAL_USER,
        password: process.env.AMQP_LOCAL_PASS,
        locale: "en_US",
        frameMax: 0,
        heartbeat: 0,
      });
      console.log("🐇 Conexión Local AMQP creada");
    }
  }

  channel = await connection.createChannel();
  console.log("📡 Canal AMQP listo");

  if (!channel) {
    throw new Error("Canal AMQP no fue creado correctamente");
  }

  return channel;
}
