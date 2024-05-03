export function delay(time_ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, time_ms);
  });
}
