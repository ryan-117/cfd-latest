import Chan from "chanjs";
const chan = new Chan();
await chan.start();
chan.run((port) => {
  console.log(`app is running on ${port}`);
});