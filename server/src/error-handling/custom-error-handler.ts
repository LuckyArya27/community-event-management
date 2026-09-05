class CustomErrorHandler extends Error {
  statusCode!: number;
  title!: string;
  constructor(message: string, title: string) {
    super(message);
    this.title = title;
  }
}

export { CustomErrorHandler };