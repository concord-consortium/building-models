PROJECT_ID=125331
OUTPUT_DIR=src/code/utils/lang
LANGUAGES=("he" "tr" "zh-TW")

# argument processing from https://stackoverflow.com/a/14203146
while [[ $# -gt 1 ]]
do
key="$1"

case $key in
    -a|--api_token)
    API_TOKEN="$2"
    shift # past argument
    ;;
    -o|--output_dir)
    OUTPUT_DIR="$2"
    shift # past argument
    ;;
esac
shift # past argument or value
done

for LANGUAGE in "${LANGUAGES[@]}"
do
    PULLARGS="-p $PROJECT_ID -l $LANGUAGE -o $OUTPUT_DIR -a $API_TOKEN"
    # echo "PULLARGS=$PULLARGS"
    ./bin/poeditor-pull.sh $PULLARGS
done
