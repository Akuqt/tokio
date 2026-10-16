import { Btn, Input, Section } from "@/components";
import { cx } from "@/helper";
import { FiPlay, FiSquare } from "react-icons/fi";
import styles from "../home.module.css";

interface Props {
  username: string;
  connected: boolean;
  loading: boolean;
  onUsernameChange: (username: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectSection({
  username,
  connected,
  loading,
  onUsernameChange,
  onConnect,
  onDisconnect,
}: Props) {
  return (
    <Section
      title="Dashboard"
      description="Connect to your TikTok Live to begin receiving events."
      actions={
        <div className={styles.status}>
          <span className={cx(styles.dot, connected && styles.dot_online)} />
          {connected ? "Connected" : "Offline"}
        </div>
      }
    >
      <div className={styles.connect_row}>
        <Input
          className={styles.username}
          placeholder="@username"
          value={username}
          disabled={connected}
          onChange={(e) => onUsernameChange(e.target.value)}
        />

        <Btn
          variant="accent"
          size="lg"
          className={styles.connect_btn}
          loading={loading}
          onClick={connected ? onDisconnect : onConnect}
        >
          {connected ? (
            <>
              <FiSquare size={18} /> Disconnect
            </>
          ) : (
            <>
              <FiPlay size={18} /> Connect
            </>
          )}
        </Btn>
      </div>
    </Section>
  );
}
