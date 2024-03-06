trim <- function (x) gsub("^\\s+|\\s+$", "", x)
args = commandArgs(trailingOnly=TRUE)
runtime_dir<-trim(args[1])	# path to folder of runtime
input_file<-trim(args[2])  # file of inputs to read
output_file<-trim(args[3])  # file to output data to
row_num<-trim(args[4])	# row in csv file to analyze
language<-trim(args[5])	# language to use
case_name<-trim(args[6]) 	# name of the case

source(paste(runtime_dir, "\\analysis\\functions.r", sep=""))

output_image1_90<-file.path(runtime_dir, "temp", "output1_90.png")
#output_image2_90<-file.path(runtime_dir, "temp", "output2_90.png")
output_image2<-file.path(runtime_dir, "temp", "output2.png")
output_image1_95<-file.path(runtime_dir, "temp", "output1_95.png")
#output_image2_95<-file.path(runtime_dir, "temp", "output2_95.png")
output_image1_99<-file.path(runtime_dir, "temp", "output1_99.png")
#output_image2_99<-file.path(runtime_dir, "temp", "output2_99.png")

output_text<-readLines(file.path(runtime_dir, "analysis", "output-schema.txt"))

load(file.path(runtime_dir, "analysis", ".RData"))

tooth_scores <- read.csv(input_file)
do.get.age(row_num, lang=language, case_name=case_name)
do.plot.teeth(row_num, lang=language, case_name=case_name)
