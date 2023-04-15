# pixeltoken-subgraph-monitoring

## Debug log

```bash
$ tail -f /var/log/automation.log
```

## Killing crontab

```bash
# cron is running under root
$ crontab -r
```

## Deploy to Automation Server

```bash
$ pwd
/home/chris/git_repo/pixeltoken-subgraph-monitoring
$ git pull
$ sh scripts/setup.sh -a deploy
[sudo] password for chris:
$ sh scripts/setup.sh -a setcron
```