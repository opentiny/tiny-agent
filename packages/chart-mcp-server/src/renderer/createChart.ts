
export async function createChart(chart, options: Record<string, any>) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(options);
    }, 1000);
  });
};