export type StoreListener = (data: any) => void; // checked: any ok
export type StoreUnsubscriber = () => void;

export declare class StoreClass {
  public listen(listener: StoreListener): StoreUnsubscriber;
  public serialize(): any; // checked: any ok
}
