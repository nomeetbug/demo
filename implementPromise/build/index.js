"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var Status;

(function (Status) {
  Status[Status["pending"] = 1] = "pending";
  Status[Status["rejected"] = 2] = "rejected";
  Status[Status["resolved"] = 3] = "resolved";
})(Status || (Status = {}));

const noop = () => {};

class MyPromise {
  constructor(exclutor) {
    this.value;
    this.reason;
    this.status = Status.pending;
    this._resolveArray = [];
    this._rejectArray = [];

    try {
      exclutor(this._reslove.bind(this), this._reject.bind(this));
    } catch (err) {
      this._reject(err);
    }
  }

  _runResolveArray() {
    while (this._resolveArray.length > 0) {
      const item = this._resolveArray.shift();

      if (noop === item.handle) {
        continue;
      }

      let result;

      try {
        result = item.handle(this.value);
      } catch (err) {
        item.promise._reject(err);
        continue;
      }

      if (result && result instanceof MyPromise) {
        result.then(val => {
          item.promise._reslove(val);
        }).catch(err => {
          item.promise._reject(err);
        });
        continue;
      }

      if (result !== undefined) {
        this.value = result;
      }

      item.promise._reslove(this.value);
    }
  }

  _runRejectArray() {
    while (this._rejectArray.length > 0) {
      const item = this._rejectArray.shift();

      if (noop === item.handle) {
        continue;
      }

      let result;

      try {
        result = item.handle(this.reason);
      } catch (err) {
        item.promise._reject(err);
        continue;
      }

      if (result && result instanceof MyPromise) {
        result.then(val => {
          item.promise._reslove(val);
        }).catch(err => {
          item.promise._reject(err);
        });
      }

      if (result !== undefined) {
        this.reason = result;
      }

      item.promise._reject(this.reason);
    }
  }

  _reslove(val) {
    if (this.status === Status.pending) {
      this.status = Status.resolved;
      this.value = val;

      this._runResolveArray();
    }
  }

  _reject(reason) {
    if (this.status === Status.pending) {
      this.status = Status.rejected;
      this.reason = reason;

      this._runRejectArray();

      while (this._resolveArray.length > 0) {
        const item = this._resolveArray.shift();

        item.promise._reject(this.reason);
      }
    } //todo run othen resolveArray 's reject

  }

  then(resHandle, rejHandle = noop) {
    const newPromise = new MyPromise(() => {});

    if (this.status === Status.pending) {
      this._resolveArray.push({
        handle: resHandle,
        promise: newPromise
      });

      this._rejectArray.push({
        handle: rejHandle,
        promise: newPromise
      });
    }

    if (this.status === Status.resolved) {
      this._resolveArray.push({
        handle: resHandle,
        promise: newPromise
      });

      this._runResolveArray();
    }

    if (this.status === Status.rejected) {
      newPromise._reject(this.reason); // this._runResolveArray()

    }

    return newPromise;
  }

  catch(rejHandle) {
    const newPromise = new MyPromise(() => {});

    if (this.status === Status.pending) {
      //just for testing
      this._resolveArray.push({
        handle: noop,
        promise: newPromise
      });

      this._rejectArray.push({
        handle: rejHandle,
        promise: newPromise
      });
    }

    if (this.status === Status.rejected) {
      this._rejectArray.push({
        handle: rejHandle,
        promise: newPromise
      });

      this._runRejectArray();
    }

    return newPromise;
  }

}

exports.default = MyPromise;