import { exec, spawn } from "node:child_process";

exec("cmd.exe /c dir", (err, stdout, stderr) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(stdout);
});

exec("kill-java.cmd", (err, stdout, stderr) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(stdout);
});
