type EventCallback<T = any> = (...args: T[]) => void;

class EventEmitter {
  private listeners: Map<string, Set<EventCallback>>;

  constructor() {
    this.listeners = new Map();
  }

  // 订阅事件
  on<T = any>(event: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  // 取消订阅
  off<T = any>(event: string, callback?: EventCallback<T>): void {
    if (!this.listeners.has(event)) return;

    if (callback) {
      this.listeners.get(event)!.delete(callback);
    } else {
      this.listeners.delete(event); // 移除所有该事件的回调
    }
  }

  // 触发事件
  emit<T = any>(event: string, ...args: T[]): void {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event)!;
    for (const callback of callbacks) {
      try {
        callback(...args);
      } catch (error) {
        console.error(`事件 ${event} 的回调执行出错:`, error);
      }
    }
  }

  // 一次性订阅
  once<T = any>(event: string, callback: EventCallback<T>): void {
    const wrapper: EventCallback<T> = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

export default EventEmitter;
