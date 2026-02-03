declare module "better-sqlite3" {
  const Database: any;
  export default Database;

  export interface Options {
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
    verbose?: (...args: any[]) => void;
  }
}
