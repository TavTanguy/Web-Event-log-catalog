import { ChildProcess, spawn } from "child_process";
import { config } from "./configFile";

export enum App {
  importDataset = "importDataset",
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function replaceAll(str: string, find: string, replace: string) {
  return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}

export class PythonApp {
  private process?: ChildProcess;
  private data: String = "";
  public constructor(app: App, ...args: string[]) {
    this.process = spawn("python3", ["src/utils/" + app + ".py", JSON.stringify(config), ...args]);

    if (this.process.stderr)
      this.process.stderr.on("data", (data) => {
        this.data += data.toString();
      });
    if (this.process.stdout)
      this.process.stdout.on("data", (data) => {
        this.data += data.toString();
      });
  }

  private getResult() {
    try {
      const lines = this.data.split("\n").filter((x) => x !== "");
      const json = JSON.parse(replaceAll(lines[lines.length - 1], "'", '"'));
      return json;
    } catch (err) {
      if (err instanceof SyntaxError) {
        console.error(this.data);

        throw new Error("Python script not send a JSON object");
      }
      throw err;
    }
  }

  public result() {
    return new Promise((resolve) => {
      if (this.process?.exitCode !== null) resolve(this.getResult());
      this.process?.on("close", (code) => {
        resolve(this.getResult());
      });
    });
  }
}
