import { MapController } from "react-map-gl";

export default class CustomMapController extends MapController {
  constructor() {
    super();
    // subscribe to additional events
    this.events = ["pan"];
  }

  // Override the default handler in MapController
  handleEvent(event) {
    if (event.type === "pan") {
      // console.log(this);
      if (event.target.className !== "overlays") {
        event.preventDefault();
      }
    }
    return super.handleEvent(event);
  }
}
