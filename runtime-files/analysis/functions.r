do.get.age <- function (id=1,lo=0.75,hi=25.75,left=0,right=25,def.int=0.1,
                  put.points=F,put.L=0,put.R=20,drop=NA,retain=NA,Known.age=NA,
                  teeths=rep(NA,13),lab=NA,anote='',lang='en-US',case_name='')
{
    ##################################################################
    tooths <-function(tt,teeth,integ)
    {
        #  j is the index for tooth (1:13)
        #  i is the score for the given tooth (2:17, as cusp initiation
        #  cannot be scored in paleoanth)

        #   tt=log10(tt+0.75)
        cum=0
        for(j in 1:13){
            i=teeth[j]
            if(!is.na(i)){
                mu1=MFH2[i,j]
                mu2=MFH2[i+1,j]
                while(mu1==mu2)
                {
                    i=i+1
                    mu2=MFH2[i,j]
                }
                sto=max(pnorm(tt,mu1,.042*log(10))-pnorm(tt,mu2,.042*log(10)),1.e-200)
                cum=cum+log(sto)
            }
        }
        return(exp(cum)/integ)
    }
    ##################################################################
    tooths2 <-function(tt,teeth,integ,mu)
    {
        #  j is the index for tooth (1:13)
        #  i is the score for the given tooth (2:17, as cusp initiation
        #  cannot be scored in paleoanth)

        #   tt=log10(tt+0.75)
        cum=0
        for(j in 1:13){
            i=teeth[j]
            if(!is.na(i)){
                mu1=MFH2[i,j]
                mu2=MFH2[i+1,j]
                while(mu1==mu2)
                {
                    i=i+1
                    mu2=MFH2[i,j]
                }
                sto=max(pnorm(tt,mu1,.042*log(10))-pnorm(tt,mu2,.042*log(10)),1.e-200)
                cum=cum+log(sto)
            }
        }
        return(exp(cum)/integ*(tt-mu)^2)
    }
    ##################################################################
    tooths3 <-function(mu,i.tooth)
    {
        mu.tran=c(-Inf,MFH2[,i.tooth])
        sto=pnorm(mu,mu.tran,.042*log(10),lower=F)
        toother=which.max(diff(sto))-1
        if(toother==0) toother=1
        return(toother)
    }
    ##################################################################
    if(!is.na(id)) teeth=as.numeric(tooth.scores[id,-1])
    else(teeth=teeths)
    if(nchar(anote)>0) anote=paste(', ',anote)
    print('Tooth scores before any potential dropped scores')
    print(teeth)
    output_text<-gsub("[[SCORES]]", paste('[', gsub("NA", "-1", paste(teeth, collapse=',')), ']', sep=''), output_text, fixed=TRUE)

    N.drop=length(drop)
    for(i in 1:N.drop) teeth[drop[i]]=NA
    if(!is.na(retain[1])){
        sto=rep(NA,13)
        N.retain=length(retain)
        for(i in 1:N.retain){
            sto[retain[i]]=teeth[retain[i]]
        }
        teeth=sto
    }

    denom=integrate(Vectorize(tooths,"tt"),lower=log(lo),upper=log(hi),teeth=teeth,integ=1.0)$val
    mu=optimize(tooths,lower=log(lo),upper=log(hi),maximum=T,teeth=teeth,integ=denom)$max
    mus=rep(NA,13)

    for(i in 1:13){
        if(!is.na(teeth[i])){
            mus[i]=MUS[teeth[i],i]
        }
    }
    between=var(mus,na.rm=T)

    within=integrate(Vectorize(tooths2,"tt"),lower=log(lo),upper=log(hi),teeth=teeth,integ=denom,mu=mu)$val
    age=log(seq(0,25,def.int)+0.75)
    N=NROW(age)
    prob=0
    for(i in 1:N) prob[i]=tooths(age[i],teeth,denom)
    top=max(prob)
    top=max(top,dnorm(mu,mu,sqrt(within)))

	png(filename=output_image1, width = 1400, height = 1200, res = 300, pointsize = 7)

	x_label <- 'Age (years)'
	y_label <- 'Density'

	if (lang == 'es') {
		x_label <- 'Edad (anos)'
		y_label <- 'Densidad'
	}


    if(!is.na(id)){
        plot(exp(age)-.75,prob,type='l',xlim=c(left,right),ylim=c(0,top),lwd=2,
             xlab=x_label,ylab=y_label,main=paste(case_name,anote),axes=F)}
    else
    {
        plot(exp(age)-.75,prob,type='l',xlim=c(left,right),ylim=c(0,top),lwd=2,
             xlab=x_label,ylab=y_label,main=lab,axes=F)}

    box()
    axis(1)
    if(put.points==T){
        age=log(seq(put.L,put.R,.05)+0.75)
        points(exp(age)-.75,dnorm(age,mu,sqrt(within)),pch=19)
    }
    else {lines(exp(age)-.75,dnorm(age,mu,sqrt(within)),lwd=2,lty=2)}
    age=log(seq(0,25,def.int)+0.75)
    if(!is.na(between)) lines(exp(age)-.75,dnorm(age,mu,sqrt(within+between)),lwd=2,lty=2)
    if(!is.na(Known.age)) lines(rep(Known.age,2),c(0,1000),lwd=2)
    print(noquote(paste('Mean natural log conception-corrected age = ',mu)))
    abline(v=exp(mu)-0.75)
    text(exp(mu)-0.75,top-0.15,round(exp(mu)-0.75,3),pos=4,cex=0.75)
    abline(v=exp(mu-(1.96*(within+between)^0.5))-0.75,lty=2,col='red')
    if(is.na(between)) abline(v=exp(mu-(1.96*(2*within)^0.5))-0.75,lty=2,col='blue')
    text(exp(mu-(1.96*(within+between)^0.5))-0.75,top-0.5,round(exp(mu-(1.96*(within+between)^0.5))-0.75,3),pos=2,cex=0.75)
    if(is.na(between)) text(exp(mu-(1.96*(2*within)^0.5))-0.75,top-0.5,round(exp(mu-(1.96*(2*within)^0.5))-0.75,3),pos=2,cex=0.75)
    abline(v=exp(mu+(1.96*(within+between)^0.5))-0.75,lty=2,col='red')
    if(is.na(between)) abline(v=exp(mu+(1.96*(2*within)^0.5))-0.75,lty=2,col='blue')
    text(exp(mu+(1.96*(within+between)^0.5))-0.75,top-0.5,round(exp(mu+(1.96*(within+between)^0.5))-0.75,3),pos=4,cex=0.75)
    if(is.na(between)) text(exp(mu+(1.96*(2*within)^0.5))-0.75,top-0.5,round(exp(mu+(1.96*(2*within)^0.5))-0.75,3),pos=4,cex=0.75)

	dev.off()

	age_val<-exp(mu)-0.75
  	age_lower<-exp(mu-(2*(within+between)^0.5))-0.75
  	age_upper<-exp(mu+(2*(within+between)^0.5))-0.75

	output_text<-gsub("[[KNOWN_AGE_VAL]]", age_val, output_text, fixed=TRUE)
    output_text<-gsub("[[KNOWN_AGE_LOWER]]", age_lower, output_text, fixed=TRUE)
    output_text<-gsub("[[KNOWN_AGE_UPPER]]", age_upper, output_text, fixed=TRUE)

	output_text<-gsub("[[MEAN_CORRECTED_AGE]]", mu, output_text, fixed=TRUE)
	output_text<-gsub("[[WITHIN_VARIANCE]]", within, output_text, fixed=TRUE)
	output_text<-gsub("[[BETWEEN_VARIANCE]]", between, output_text, fixed=TRUE)
	# output_text<-gsub("[[LOWER_LIMIT]]", lo, output_text, fixed=TRUE)
	# output_text<-gsub("[[UPPER_LIMIT]]", hi, output_text, fixed=TRUE)


    print(noquote(paste('Within-tooth variance  = ',within)))
    print(noquote(paste('Between-tooth variance = ',between)))
    print(noquote(paste('Lower limit of integration (straight scale) = ',lo)))
    print(noquote(paste('Upper limit of integration (straight scale) = ',hi)))
    if(!is.na(id)) (lab=as.vector(tooth.scores[id,1]))
    new.teeth=rep(NA,13)
    for(i in 1:13){
        if(!is.na(teeth[i])) new.teeth[i]=tooths3(mu,i)
    }



    if(!is.na(new.teeth[1]))
    {if(new.teeth[1]==8) new.teeth[1]=teeth[1]}
    for(i in 4:5){
        if(!is.na(new.teeth[i]))
        {if(new.teeth[i]<=8) new.teeth[i]=teeth[i]}}
    for(i in 6:7){
        if(!is.na(new.teeth[i]))
        {if(new.teeth[i]<=8) new.teeth[i]=teeth[i]}}
    for(i in 8:10){
        if(!is.na(new.teeth[i]))
        {if(new.teeth[i]==8) new.teeth[i]=teeth[i]}}
    obj=tooths(tt=mu,teeth=teeth,integ=1)
    nu=tooths(tt=mu,teeth=new.teeth,integ=1)
    print('Most likely scores given age (estimated after any potential drops)')
    print(new.teeth)
    print(obj)
    print(nu)
    for(i in 1:13){
        new.teeth[i]=tooths3(mu,i)
    }
    if(!is.na(new.teeth[1]))
    {if(new.teeth[1]==8) new.teeth[1]=teeth[1]}
    for(i in 4:5){
        if(!is.na(new.teeth[i]))
        {if(new.teeth[i]<=8) new.teeth[i]=teeth[i]}}
    for(i in 6:7){
        if(!is.na(new.teeth[i]))
        {if(new.teeth[i]<=8) new.teeth[i]=teeth[i]}}
    for(i in 8:10){
        if(!is.na(new.teeth[i]))
        {if(new.teeth[i]==8) new.teeth[i]=teeth[i]}}

    print(new.teeth)
    print(obj/nu)

	fileConn<-file(output_file)
	writeLines(output_text, fileConn)
	close(fileConn)


    if(is.na(between)) return(list(lab=lab,mu=mu,within=within,between=between,p.seq=NA))
    return(list(lab=lab,mu=mu,within=within,between=between,p.seq=obj/nu))
}


do.plot.teeth<-function(id=1,Known.L=-10,Known.R=-10,teeths=c(NA,15,14,NA,5,NA,NA,9,6,5,NA,NA,NA),
                     sto.lab='Expected Formation at Age 10', lang='en-US', case_name='')
{
    ##################################################################
    tooths <-function(tt,j = 1, i = 2)
    {
        #  j is the index for tooth (1:13)
        #  i is the score for the given tooth (2:17, as cusp initiation
        #  cannot be scored in paleoanth)
        mu1=MFH2[i,j]
        mu2=MFH2[i+1,j]
        while(mu1==mu2)
        {
            i=i+1
            mu2=MFH2[i,j]
        }
        return(pnorm(tt,mu1,.042*log(10))-pnorm(tt,mu2,.042*log(10)))
    }
    ##################################################################

	png(filename=output_image2, width = 1400, height = 1200, res = 300, pointsize = 7)

	x_label <- 'Age (years)'
	y_label <- 'Density'

	if (lang == 'es') {
		x_label <- 'Edad (anos)'
		y_label <- 'Densidad'
	}

    if(!is.na(id)){
        plot(c(0,1),c(0,1),type='n',xlim=c(-1,22),axes=F,
             xlab=x_label,ylab=y_label,ylim=c(0,13),
             main=paste(case_name))}
    else{plot(c(0,1),c(0,1),type='n',xlim=c(-1,22),axes=F,
              xlab=x_label,ylab=y_label,ylim=c(0,13),main=sto.lab)}
    box()
    axis(1)
    for(i in 0:12) abline(i,0)
    lines(c(0,0),c(-1,14))
    lines(c(20,20),c(-1,14))
    if(Known.L!=-10) lines(rep(Known.L,2),c(-1,14))
    if(Known.R!=-10) lines(rep(Known.R,2),c(-1,14))
    if(is.na(id)) teeth=teeths
    else {teeth=tooth.scores[id,-1]}
    #print(teeth)

    test.uni=c(1,4:10)
    for(i in 1:8){
        test.it=teeth[test.uni[i]]
        if(!is.na(test.it)){
            if(test.it==8) return(' No root clefts for uniradicular tooth')
        }
    }

    logage=seq(log(.75),log(20.75),.01)

    for(j in 1:13){
        if(!is.na(teeth[j])){

            mle=optimize(tooths,interval=c(log(.75),log(25)),j=j,i=as.numeric(teeth[j]),maximum=T)$objective/0.95


            polygon(c(0,exp(logage)-.75,20,0),
                    c(13-j,tooths(logage,j=j,i=as.numeric(teeth[j]))/obj[as.numeric(teeth[j]),j]+13-j,13-j,13-j),density=40)
        }
    }

    teeth.lab=c('c','m1','m2','UI1','UI2','LI1','LI2','C','P3','P4','M1','M2','M3')
    for(i in 1:13) text(-.9,13-i+.5,teeth.lab[i])
    for(i in 1:13){
        j=as.numeric(teeth[i])
        if(!is.na(j)) text(20.2,13-i+.5,scores[j],adj=c(0,.5))
    }

	dev.off()
}
