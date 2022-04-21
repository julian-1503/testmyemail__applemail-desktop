export interface Watching {
  watch: () => Watching;
  handleTestAdded: (callback: (ssGuid: string) => void) => Watching;
  handleTestRemoved: (callback: (ssGuid: string) => void) => Watching;
}
