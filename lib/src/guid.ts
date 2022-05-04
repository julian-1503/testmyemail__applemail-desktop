class Guid implements GuidExpressable {
  private readonly guidRegex: RegExp =
    /^((\d{4}-\d{2}-\d{2})_(((\d+)_(\d+)(_(\d+))?)(_no_images)?)_([a-zA-Z]{2,4}))/;

  private _guid = '';

  constructor(guid: string) {
    this._guid = guid;
  }

  /**
   * Extract the zone from the GUID.
   */
  getZone(): string {
    const result = this.extractAllPartsFromGuid();

    return result[10] || '';
  }

  /**
   * Extract the test sent date from the GUID.
   */
  getDate() {
    const result = this.extractAllPartsFromGuid();

    return result[2] || '';
  }

  /**
   * Extract the test sent time from the GUID.
   */
  getTime(): string {
    const result = this.extractAllPartsFromGuid();
    const time = result[8] || result[6];

    return (time || '').replace(/(.{2})/g, '$1:').slice(0, -1);
  }

  /**
   * Extract the member id from the legacy GUID.
   */
  getMemberId(): string {
    const result = this.extractAllPartsFromGuid();

    return result[5] || '';
  }

  /**
   * Whether the test wants to check for Image Blocking.
   */
  hasImageBlocking(): string {
    const hasImageBlock = this._guid.indexOf('_no_images') >= 0;

    return hasImageBlock ? 'Y' : '';
  }

  /**
   * Divide the GUID into its different components.
   */
  private extractAllPartsFromGuid(): string[] {
    const result = this.guidRegex.exec(this._guid);

    return result || [];
  }
}

export default Guid;

export interface GuidExpressable {
  getZone: () => string;
  getDate: () => string;
  getTime: () => string;
  getMemberId: () => string;
  hasImageBlocking: () => string;
}
