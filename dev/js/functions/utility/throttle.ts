export default function throttle (f: Function, wait: number) {
  let isThrottling: boolean = false;
  let hasTrailingCall: boolean = false;
  let lastContext: any;
  let lastArgs: any;
  let lastResult: any;

  const invokeFunc = (context: any, args: any) => {
    lastResult = f.apply(context, args);
    isThrottling = true;

    setTimeout(() => {
      isThrottling = false;

      if (hasTrailingCall) {
        invokeFunc(lastContext, lastArgs);

        lastContext = undefined;
        lastArgs = undefined;
        hasTrailingCall = false;
      }
    }, wait);
  };

  return function (...args: any[]) {
    if (!isThrottling) {
      invokeFunc(this, args);
    } else {
      hasTrailingCall = true;
      lastContext = true;
      lastArgs = args;
    }

    return lastResult;
  };
}
