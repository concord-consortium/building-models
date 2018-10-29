export type StoreListener = (data: any) => void;
export type StoreUnsubscriber = () => void;

export declare class StoreClass {
  public listen(listener: StoreListener): StoreUnsubscriber;
  public serialize(): any;
}
