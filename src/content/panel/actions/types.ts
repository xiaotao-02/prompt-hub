export type DataActionContext = {
  root: HTMLElement;
  el: HTMLElement;
  event: MouseEvent;
};

export type DataActionHandler = (ctx: DataActionContext) => void;
