export abstract class ValueObject<TProps extends Record<string, unknown>> {
  protected readonly props: Readonly<TProps>;

  protected constructor(props: TProps) {
    this.props = Object.freeze({ ...props });
  }

  equals(vo?: ValueObject<TProps>): boolean {
    if (!vo) return false;
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}
