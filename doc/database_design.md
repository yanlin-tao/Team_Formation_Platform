# Database Design 

## 1. Database Implementation

### 1.1 Environment Setup

Our database is deployed on **Google Cloud SQL (Enterprise Edition)**.  
The following table summarizes our instance configuration and connection details.

| **Category** | **Configuration** |
|---------------|------------------|
| **Cloud SQL Edition** | Enterprise Edition |
| **Region** | us-central1 (Iowa) |
| **Database Engine** | MySQL 8.0 |
| **vCPU** | 1 vCPU |
| **RAM** | 628.74 MB |
| **Storage Type** | 10 GB SSD |
| **Cache** | Disabled |
| **Network Throughput (MB/s)** | 125 / 125 |
| **IOPS** | Read 6,300 ( max 12,000 ), Write 6,300 ( max 10,000 ) |
| **Disk Throughput (MB/s)** | Read 4.8 ( max 125 ), Write 4.8 ( max 107.8 ) |
| **Connection Type** | Public IP |
| **Public IP Address** | `34.172.159.62` |
| **Default TCP Port** | `3306` |
| **Connection Name** | `cs411-sqlmaster:us-central1:fa25-cs411-team001-sqlmaster` |
| **Backup Policy** | Automatic |
| **Availability Type** | Single Zone |
| **Point-in-Time Recovery** | Enabled |

**Description:**  
This Cloud SQL instance hosts our team database (`team001_db`) for Stage 3.  
We connect using the public IP address `34.172.159.62` on port `3306`.  
Each team member can access the instance via MySQL Workbench or CLI using their assigned credentials.

**Screenshots:**

- **Cloud SQL Instance Summary:**  
<p align="center">
    <img src="./img_src/cloudsql_summary.png" alt="cloudsql_summary"
        style="width:100%; height:auto; max-width:40%;">
  <br><em>Figure 1. cloudsql_summary</em>
</p>

- **Connection Details:**  
<p align="center">
    <img src="./img_src/cloudsql_connection.png" alt="cloudsql_connection"
        style="width:100%; height:auto; max-width:100%;">
  <br><em>Figure 2. cloudsql_connection</em>
</p>


