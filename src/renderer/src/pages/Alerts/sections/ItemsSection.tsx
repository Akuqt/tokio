import { Alert } from "@/common/schemas";
import { CustomGift } from "@/common/types";
import { AlertItem } from "@/components";
import { AlertTestRequest } from "@renderer/hooks";
import { Dispatch } from "react";
import styles from "../alerts.module.css";
import { AlertsAction } from "../helper";

type Props = {
  items: Alert[];
  gifts: CustomGift[];
  // Id of the sound test loading or playing
  testing: string | null;
  onTest: (req: AlertTestRequest) => void;
  dispatch: Dispatch<AlertsAction>;
};

export function ItemsSection({
  items,
  gifts,
  testing,
  onTest,
  dispatch,
}: Props) {
  return (
    <div className={styles.section}>
      <div className={styles.alerts_row_info}>
        <div className={styles.column_item_info}>
          <p>Actions</p>
        </div>
        <div className={styles.column_item_info}>
          <p>Enabled</p>
        </div>
        <div className={styles.column_item_info}>
          <p>Trigger</p>
        </div>
        <div></div>
        <div className={styles.column_item_info}>
          <p>Sound</p>
        </div>
        <div className={styles.column_item_info}>
          <p>Volume</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>
          No alerts yet. Use the add button to create one.
        </p>
      ) : (
        items.map((alert) => (
          <AlertItem
            key={alert.id}
            alert={alert}
            gifts={gifts}
            testing={testing === alert.id}
            onTest={onTest}
            onChange={(a) => dispatch({ type: "updateAlert", payload: a })}
            onRemove={() =>
              dispatch({ type: "removeAlert", payload: alert.id })
            }
            onPickSound={() =>
              dispatch({ type: "setPickerFor", payload: alert.id })
            }
          />
        ))
      )}
    </div>
  );
}
