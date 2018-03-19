#! /usr/bin/env bash
shopt -s extglob

dir=$(cd $(dirname $0) && pwd)
for i in $(ls -d $dir/*/); do
	ln -sfn $i $GALAXY_ROOT/config/plugins/webhooks/$(basename $i)
done

cfg=$(ls $GALAXY_ROOT/config/galaxy.+(yml|ini) | head -1 &> /dev/null)
sample=$(ls $GALAXY_ROOT/config/galaxy.+(yml|ini).sample | head -1 )
[[ ! $cfg ]] && cfg=$(dirname $sample)/$(basename $sample .sample) && cp $sample $cfg
sed -i -r 's/(^\s*)#+(\s*webhooks_dir.+)/\1\2/' $cfg
sed -i -r 's/(^\s*)#+(\s*tour_config_dir.+)/\1\2/' $cfg
sed -i -r 's/(^\s*)#+(\s*tool_path.+)/\1\2/' $cfg
