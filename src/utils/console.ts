
export const read = async (stream: NodeJS.ReadStream): Promise<string> => {
    return new Promise((resolve, reject) => {
        stream.on("data", (chunk) => {  
            resolve(chunk.toString());
        });
        stream.on("error", (err) => reject(err));
    });
}