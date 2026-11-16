import { exec } from "child_process";
import { promises as fs } from "fs";


const execCommand = ({ command }) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) reject(error);
            resolve(stdout);
        });
    });
};