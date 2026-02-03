# 🐳 TrueNAS Scale: Exposing Ollama via Tailscale

Since **Tailscale** and **Ollama** run as separate apps on TrueNAS Scale (Kubernetes), you need to bridge them so you can access Ollama (Port 11434) remotely.

## Method 1: Host Network (Recommended)
This is the simplest method. It allows the Tailscale app to see all ports running on the TrueNAS host IP.

1.  **Apps** > **Tailscale** > **Edit** (`...` > Edit).
2.  Scroll to **Network Configuration**.
3.  Check the box **Host Network**.
4.  **Save**.
5.  Wait for the app to redeploy.
6.  **Verify:** You should now be able to access Ollama via your Tailscale IP:
    `http://<Your-Tailscale-IP>:11434`

---

## Method 2: Advertise Routes (Subnet Router)
If "Host Network" doesn't work or you want access to your entire home network (e.g., `192.168.1.x`).

### Step 1: Configure TrueNAS App
1.  **Apps** > **Tailscale** > **Edit**.
2.  Uncheck "Host Network" (if you want isolated mode) OR keep it checked.
3.  Look for **Advertise Routes**.
4.  Add your TrueNAS subnet.
    -   Example: `192.168.1.0/24` (Replace with your actual subnet).
5.  **Save**.

### Step 2: Approve in Tailscale Console
1.  Go to [login.tailscale.com/admin/machines](https://login.tailscale.com/admin/machines).
2.  Find your **TrueNAS** machine.
3.  Click `...` > **Edit route settings**.
4.  Enable the toggle for `192.168.1.0/24`.
5.  **Verify:** On your laptop, disconnect/reconnect Tailscale.
6.  Access Ollama via the **LAN IP**:
    `http://192.168.1.100:11434` (Replace with your TrueNAS LAN IP).

---

## Method 3: Userspace "Serve" (Advanced)
If you cannot use Host Network, you can tell Tailscale to forward traffic.

1.  Open the Shell of the running **Tailscale** container.
2.  Run:
    ```bash
    tailscale serve --bg 11434 http://127.0.0.1:11434
    ```
    *(Note: This assumes Ollama shares localhost, which is rarely true in K8s unless they are in the same Pod. Method 1 or 2 is much better.)*

## 💡 Troubleshooting
-   **"Fetch Failed"**: This usually means DNS isn't resolving. Try using the IP address instead of the name.
-   **ACLs**: Ensure your Tailscale Access Control List (ACL) allows traffic on port `11434`. (Default is "Allow All").
