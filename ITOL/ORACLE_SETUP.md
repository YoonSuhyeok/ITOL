# Oracle Database Support Setup Guide

## Prerequisites

To use Oracle database connections in ITOL, you need to install Oracle Instant Client on your system.

## Installation Instructions

### Windows

1. Download Oracle Instant Client from Oracle's official website:
   - Go to: https://www.oracle.com/database/technologies/instant-client/downloads.html
   - Download the appropriate version for your Windows system (x64)

2. Extract the downloaded ZIP file to a directory (e.g., `C:\oracle\instantclient_21_13`)

3. Add the Instant Client directory to your PATH:
   - Open System Properties → Environment Variables
   - Add the Instant Client directory to the `PATH` variable
   - Example: `C:\oracle\instantclient_21_13`

4. Restart your application after setting up the PATH

### Linux

1. Download Oracle Instant Client:
   ```bash
   wget https://download.oracle.com/otn_software/linux/instantclient/instantclient-basic-linux.x64-21.13.0.0.0dbru.zip
   ```

2. Extract and install:
   ```bash
   unzip instantclient-basic-linux.x64-21.13.0.0.0dbru.zip
   sudo mv instantclient_21_13 /opt/oracle/
   ```

3. Set up library path:
   ```bash
   echo /opt/oracle/instantclient_21_13 | sudo tee /etc/ld.so.conf.d/oracle-instantclient.conf
   sudo ldconfig
   ```

4. Set environment variables in your `~/.bashrc` or `~/.zshrc`:
   ```bash
   export LD_LIBRARY_PATH=/opt/oracle/instantclient_21_13:$LD_LIBRARY_PATH
   ```

### macOS

1. Download Oracle Instant Client for macOS

2. Extract and install:
   ```bash
   unzip instantclient-basic-macos.x64-21.13.0.0.0dbru.zip
   sudo mv instantclient_21_13 /usr/local/oracle/
   ```

3. Set up library path in `~/.zshrc` or `~/.bash_profile`:
   ```bash
   export DYLD_LIBRARY_PATH=/usr/local/oracle/instantclient_21_13:$DYLD_LIBRARY_PATH
   ```

## Connection Configuration

When creating an Oracle database node, you need to provide:

- **Host**: Oracle server hostname or IP address
- **Port**: Oracle listener port (default: 1521)
- **Service Name** (recommended): Oracle service name (e.g., ORCL)
  - OR -
- **SID**: Oracle System Identifier (alternative to Service Name)
- **Username**: Database username
- **Password**: Database password

### Connection String Examples

**Using Service Name** (Recommended):
```
//hostname:1521/ORCL
```

**Using SID**:
```
hostname:1521/ORCL
```

## Testing Connection

Use the "Test Connection" button in the DB Node Editor to verify your Oracle connection is working correctly before saving the node.

## Troubleshooting

### Error: "Oracle database is not yet supported"
- Make sure you're using the latest version of the application
- Verify Oracle Instant Client is installed and in your PATH

### Error: "Failed to connect to Oracle"
- Check that Oracle Instant Client is properly installed
- Verify the connection parameters (host, port, service name/SID)
- Ensure the Oracle database server is accessible from your network
- Check firewall settings

### Error: "DPI-1047: Cannot locate a 64-bit Oracle Client library"
- Install the 64-bit version of Oracle Instant Client
- Make sure the Instant Client directory is in your PATH
- Restart the application after installation

### Error: "ORA-12154: TNS:could not resolve the connect identifier"
- Verify the service name or SID is correct
- Check that either service_name or sid is provided (not both)

## Additional Resources

- [Oracle Instant Client Documentation](https://www.oracle.com/database/technologies/instant-client.html)
- [Oracle Database Connection Strings](https://docs.oracle.com/en/database/oracle/oracle-database/21/netag/configuring-naming-methods.html)
