    FILE *pF = fopen("book_Records.txt", "r");
    FILE *pT = fopen("temporary.txt", "a");

    while(fscanf(pF, "%s %s %s %lf %lf \n", name, author, publisher, &bookid, &quantity) != EOF)
    {
        compare = strcmp(find, name);

        if(compare == 0)
        {
            printf("\n---------------------------------------------\n");
            printf(">>> Record Deleted <<<\n");
            printf("-----------------------------------------------\n\n");
            printf("Redirecting to Book Panel...");

            flag = 1;
        }
        else
        {
            fprintf(pT, "%s %s %s %.0lf %.0lf \n", name, author, publisher, bookid, quantity);
        }
    }

    fclose(pF);
    fclose(pT);
 
    fflush(stdin); 

    pF = fopen("book_Records.txt", "w");
    fclose(pF);

    if(flag == 0)
    {
        printf("\n\n-------------------------------\n");
        printf(">>> Record Not Found <<<\n");
        printf("-------------------------------\n\n");
        printf("Redirecting to Book Panel...");
    }

    pF = fopen("book_Records.txt", "a");
    pT = fopen("temporary.txt", "r");

    while(fscanf(pT, "%s %s %s %lf %lf \n", name, author, publisher, &bookid, &quantity) != EOF)
    {
        fprintf(pF, "%s %s %s %.0lf %.0lf \n", name, author, publisher, bookid, quantity);
    }

    fclose(pF);
    fclose(pT);

    pT = fopen("temporary.txt", "w");
    fclose(pT);

    Sleep(2000);
    bookPanel();
}
// Program Ends here -- Have a nice day
