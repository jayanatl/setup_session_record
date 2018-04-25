#!/bin/bash
if [ ${EUID} eq 0 ]; then
    echo "Error: Run this command as a normal user, with sudo access"
    exit 127
fi
loc="/tmp/jayan_setupScreenRecord"
web_loc="sessions"
mkdir ${loc}
cd ${loc}
sudo yum -y install httpd
mkdir /var/www/html/${web_loc}
git clone git@github.com:ysangkok/terminal_web_player.git
cp terminal_web_player/view.* /var/www/html/${web_loc}
wget https://raw.github.com/chjj/tty.js/d379c6f9/static/term.js -o /var/www/html/view/term.js
mkdir -p ~/workshop/{bin,sessions}
grep 'PATH=$PATH:~/workshop/bin' ~/.bashrc || echo "export PATH=$PATH:~/workshop/bin" >> ~/.bashrc
export PATH=$PATH:~/workshop/bin
wget https://raw.githubusercontent.com/jayanatl/setup_session_record/master/start_recording -o ~/workshop/bin/start_recording
chmod u+x ~/workshop/bin/start_recording
systemctl enable httpd
systemctl start httpd
