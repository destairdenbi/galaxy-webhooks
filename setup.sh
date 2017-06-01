#! /usr/bin/env bash
dir=$(cd $(dirname $0) && pwd)
for i in $(ls -d $dir/*/); do
	ln -sfn $i $GALAXY_ROOT/config/plugins/webhooks/$(basename $i)
done

sed -i -r 's/^\s*#+(\s*webhooks_dir.+)/\1/' $GALAXY_ROOT/config/galaxy.ini
sed -i -r 's/^\s*#+(\s*tour_config_dir.+)/\1/' $GALAXY_ROOT/config/galaxy.ini

# source $HOME/programs/galaxy/.venv/bin/activate
# pip install bioblend
# deactivate

planemo serve --galaxy_root=$GALAXY_ROOT
