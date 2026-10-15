import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { createStack } from "@/helper/events";

const events = createStack();

events.push(APP_EVENTS.GET_TEST_OVERLAYS, async ({ overlayService }, e) => {
  e.reply(APP_EVENTS_RESPONSE.GET_TEST_OVERLAYS, {
    success: true,
    data: overlayService.getTestOverlays(),
  });
});

events.push(
  APP_EVENTS.ADD_TEST_OVERLAY,
  async ({ overlayService }, e, { name }) => {
    e.reply(
      APP_EVENTS_RESPONSE.GET_TEST_OVERLAYS,
      await overlayService.createTestOverlay(name),
    );
  },
);

events.push(
  APP_EVENTS.REMOVE_TEST_OVERLAY,
  async ({ overlayService }, e, { id }) => {
    e.reply(
      APP_EVENTS_RESPONSE.GET_TEST_OVERLAYS,
      await overlayService.removeTestOverlay(id),
    );
  },
);

events.push(
  APP_EVENTS.SEND_TEST_EVENTS,
  async ({ overlayService }, e, { id }) => {
    e.reply(APP_EVENTS_RESPONSE.SEND_TEST_EVENTS, {
      id,
      success: overlayService.sendTestEvents(id).success,
    });
  },
);

export default events;
