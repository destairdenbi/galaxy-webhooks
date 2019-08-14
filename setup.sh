#! /usr/bin/env bash
shopt -s extglob

dir=$(cd $(dirname $0) && pwd)
for i in $(ls -d $dir/*/); do
	ln -sfn $i $GALAXY_ROOT/config/plugins/webhooks/$(basename $i)
done

cfg=$(ls $GALAXY_ROOT/config/galaxy.+(yml|ini) 2> /dev/null | head -1)
sample=$(ls $GALAXY_ROOT/config/galaxy.+(yml|ini).sample | head -1 )
[[ ! $cfg ]] && cfg=$(dirname $sample)/$(basename $sample .sample) && cp $sample $cfg
sed -i -r 's/(^\s*)#+(\s*webhooks_dir.+)/\1\2/' $cfg
sed -i -r 's/(^\s*)#+(\s*tour_config_dir.+)/\1\2/' $cfg
sed -i -r 's/(^\s*)#+(\s*tool_path.+)/\1\2/' $cfg
sed -i -r 's/(^\s*)#+(\s*new_user_dataset_access_role_default_private\s*[:=]\s*).*/\1\2true/' $cfg
sed -i -r 's/(^\s*)#+(\s*allow_user_dataset_purge\s*[:=]\s*).*/\1\2true/' $cfg

if [[ ! $(grep -F 'de.STARI-workflow-generator' $GALAXY_ROOT/tools/data_source/upload.xml) ]]; then
sed -i '$ d' $GALAXY_ROOT/tools/data_source/upload.xml
cat << EOF >> $GALAXY_ROOT/tools/data_source/upload.xml
  <citations>
    <citation type="bibtex">@Article{de.STARI-workflow-generator,                           
      author   = {Lott, Steffen C. and Wolfien, Markus and Riege, Konstantin and Bagnacani, Andrea and Wolkenhauer, Olaf and Hoffmann, Steve and Hess, Wolfgang R.},
      title    = {Customized workflow development and data modularization concepts for {RNA}-{S}equencing and metatranscriptome experiments.},
      journal  = {J. Biotechnol.},
      year     = {2017},
      volume   = {261},     
      pages    = {85--96},      
      month    = {Nov},   
      issn     = {1873-4863},      
      day      = {10},
      doi      = {10.1016/j.jbiotec.2017.06.1203},       
      language = {eng},
      url      = {http://www.ncbi.nlm.nih.gov/pubmed/28676233},
    }
    </citation>
  </citations>
</tool>
EOF
fi
